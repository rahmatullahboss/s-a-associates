/**
 * HMAC-SHA256 signed session tokens for Cloudflare Workers.
 *
 * Token format (dot-separated, base64url-encoded parts):
 *   {userId}.{timestampSeconds}.{hmac(secret, "userId.timestampSeconds")}
 *
 * This makes session tokens unforgeable without the SESSION_SECRET,
 * eliminating the account-takeover vector from plain userId cookies.
 */

function base64UrlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/**
 * Creates a signed session token encoding the userId.
 */
export async function createSessionToken(userId: number, secret: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${userId}.${timestamp}`;
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${base64UrlEncode(sig)}`;
}

/**
 * Verifies a session token. Returns the userId on success, null on any failure.
 * @param token      The raw cookie value.
 * @param secret     The HMAC secret (SESSION_SECRET worker env var).
 * @param maxAgeSecs Maximum allowed token age in seconds (default 30 days).
 */
export async function verifySessionToken(
  token: string,
  secret: string,
  maxAgeSecs = 30 * 24 * 60 * 60,
): Promise<number | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [userIdStr, timestampStr, sigB64] = parts;
    const userId = parseInt(userIdStr, 10);
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(userId) || isNaN(timestamp)) return null;

    // Check token age
    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > maxAgeSecs) return null;

    // Verify HMAC signature
    const payload = `${userIdStr}.${timestampStr}`;
    const key = await importHmacKey(secret);
    const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));

    const providedSig = base64UrlDecode(sigB64);
    const expectedBytes = new Uint8Array(expectedSig);

    if (providedSig.length !== expectedBytes.length) return null;

    // Constant-time comparison
    let diff = 0;
    for (let i = 0; i < expectedBytes.length; i++) diff |= providedSig[i] ^ expectedBytes[i];
    if (diff !== 0) return null;

    return userId;
  } catch {
    return null;
  }
}
