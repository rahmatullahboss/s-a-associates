/// <reference types="@cloudflare/workers-types" />
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema.js';

export const db = (d1: D1Database) => drizzle(d1, { schema });
