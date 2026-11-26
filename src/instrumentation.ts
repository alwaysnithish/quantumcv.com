/**
 * src/instrumentation.ts
 * Next.js runs the `register()` export from this file once, at server
 * startup, before any request handling.
 *
 * Why this exists: libraries like @google/generative-ai use Node's native
 * fetch (built on `undici`). Unlike older HTTP clients (e.g. `gaxios`, used
 * by google-auth-library), undici's fetch does NOT automatically read the
 * HTTP_PROXY / HTTPS_PROXY environment variables. On a network that
 * requires an authenticated proxy for all outbound traffic (e.g. a college
 * network), this means Gemini API calls fail with "fetch failed" even
 * though HTTPS_PROXY is correctly set in the shell — because undici was
 * never told to look at it.
 *
 * Setting a global undici ProxyAgent dispatcher here makes every native
 * fetch() call in the server process (Gemini, and anything else using
 * fetch) go through the same proxy your shell is already configured for.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxyUrl) return;

  const { setGlobalDispatcher, ProxyAgent } = await import('undici');
  setGlobalDispatcher(new ProxyAgent(proxyUrl));

  console.log(`[instrumentation] Routing native fetch() through proxy: ${proxyUrl.replace(/:[^:@]+@/, ':***@')}`);
}
