/**
 * DB-backed rate limiter using the existing `rateLimits` table.
 *
 * Uses an upsert strategy safe for D1/SQLite:
 *   - If no record exists, insert with count=1.
 *   - If record exists and not expired, increment count.
 *   - If record exists and expired, reset count=1 with new window.
 */

import { rateLimits } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { db as DbFn } from '../db/client.js';

type DbClient = ReturnType<typeof DbFn>;

export interface RateLimitResult {
  limited: boolean;
  retryAfter?: number; // seconds until the window resets
}

/**
 * Check and increment a rate-limit counter.
 * Returns `{ limited: true, retryAfter }` when the limit is exceeded.
 */
export async function checkAndIncrementRateLimit(
  dbClient: DbClient,
  key: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);

  const [existing] = await dbClient
    .select()
    .from(rateLimits)
    .where(eq(rateLimits.key, key))
    .limit(1);

  if (!existing || existing.expiresAt <= now) {
    // No record or expired window — start fresh
    await dbClient
      .insert(rateLimits)
      .values({ key, count: 1, expiresAt: now + windowSeconds })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: { count: 1, expiresAt: now + windowSeconds },
      });
    return { limited: false };
  }

  // Active window
  if (existing.count >= maxAttempts) {
    return { limited: true, retryAfter: existing.expiresAt - now };
  }

  await dbClient
    .update(rateLimits)
    .set({ count: existing.count + 1 })
    .where(eq(rateLimits.key, key));

  return { limited: false };
}

/**
 * Clear the rate-limit counter for a key (call on successful login).
 */
export async function clearRateLimit(dbClient: DbClient, key: string): Promise<void> {
  await dbClient.delete(rateLimits).where(eq(rateLimits.key, key));
}
