import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * next/og (Satori) has no page context, so `src="/logo.png"` resolves to
 * nothing and the image silently renders blank. The file has to be handed over
 * as an absolute URL or inlined. Inlining is used here so the OG image keeps
 * working on localhost, on preview deploys, and before DNS is pointed.
 *
 * Requires the Node runtime — `export const runtime = 'edge'` cannot use fs.
 *
 * The result is cached per lambda instance; the file never changes at runtime.
 */
let cached: string | null = null;

export async function getLogoDataUri(): Promise<string> {
  if (cached) return cached;
  const bytes = await readFile(join(process.cwd(), 'public', 'logo.png'));
  cached = `data:image/png;base64,${bytes.toString('base64')}`;
  return cached;
}
