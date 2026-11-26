import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

// drizzle-kit is a standalone CLI tool, not part of the Next.js dev server —
// it doesn't automatically read .env.local the way `next dev` does, so we
// load it explicitly here. Without this, DATABASE_URL appears "undefined"
// to drizzle-kit even though it's correctly set for the app itself.
config({ path: '.env.local' });

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
