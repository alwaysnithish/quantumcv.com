import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon's HTTP driver — each query is a single HTTPS request, no persistent
// TCP connection pool to manage. This is the recommended driver for
// serverless/edge environments (Vercel, etc.) since it avoids the
// connection-exhaustion problems a traditional pg Pool has under
// serverless's many-short-lived-invocations model.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Add your Neon connection string to .env.local (see .env.example).'
  );
}

const sql = neon(DATABASE_URL);
export const db = drizzle(sql, { schema });
