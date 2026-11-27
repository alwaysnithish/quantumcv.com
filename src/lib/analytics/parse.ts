/**
 * src/lib/analytics/parse.ts
 * Dependency-free helpers for the first-party analytics: user-agent parsing,
 * bot detection, referrer classification, geo headers and IP masking.
 */
import { createHash } from 'crypto';

export function isBot(ua: string): boolean {
  if (!ua) return true;
  return /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link|pinterest|whatsapp|telegram|discord|preview|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|curl|wget|python-requests|axios|node-fetch|go-http|java\/|httpclient|scrapy|ahrefs|semrush|mj12|dotbot|petalbot|yandex|baiduspider|bytespider|gptbot|claudebot|ccbot|perplexity|applebot|duckduckbot/i.test(ua);
}

export interface UA { device: 'mobile' | 'tablet' | 'desktop'; browser: string; os: string }

export function parseUA(ua: string): UA {
  const tablet = /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua);
  const mobile = !tablet && /mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua);
  let browser = 'Other';
  if (/edg(e|a|ios)?\//i.test(ua)) browser = 'Edge';
  else if (/opr\/|opera/i.test(ua)) browser = 'Opera';
  else if (/samsungbrowser/i.test(ua)) browser = 'Samsung Internet';
  else if (/ucbrowser/i.test(ua)) browser = 'UC Browser';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  let os = 'Other';
  if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/mac os x|macintosh/i.test(ua)) os = 'macOS';
  else if (/cros/i.test(ua)) os = 'ChromeOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  return { device: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop', browser, os };
}

const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave|baidu|yandex|startpage|qwant|search\.brave)\./i;
const SOCIAL = /(^|\.)(facebook|fb|instagram|linkedin|lnkd|twitter|x|t|reddit|youtube|youtu|pinterest|whatsapp|wa|telegram|t\.me|discord|quora|snapchat|threads)\./i;
const SOCIAL_EXACT = /^(t\.co|lnkd\.in|wa\.me|youtu\.be|x\.com|fb\.me|t\.me)$/i;

export function classifySource(referrer: string, selfHost: string, utmMedium = '', utmSource = ''): { host: string; source: string } {
  let host = '';
  try { host = referrer ? new URL(referrer).hostname.replace(/^www\./, '') : ''; } catch {}
  const medium = utmMedium.toLowerCase();
  if (/^(cpc|ppc|paid|paidsearch|display|ads?)$/.test(medium)) return { host, source: 'paid' };
  if (/^(email|newsletter)$/.test(medium)) return { host, source: 'email' };
  if (/^(social|social-network|sm)$/.test(medium)) return { host, source: 'social' };
  if (!host || host === selfHost.replace(/^www\./, '')) return { host: host && host !== selfHost ? host : '', source: utmSource ? 'campaign' : 'direct' };
  if (SEARCH.test(host + '.')) return { host, source: 'organic' };
  if (SOCIAL.test(host + '.') || SOCIAL_EXACT.test(host)) return { host, source: 'social' };
  return { host, source: 'referral' };
}

export function geoFromHeaders(h: Headers) {
  const dec = (v: string | null) => { try { return v ? decodeURIComponent(v) : ''; } catch { return v ?? ''; } };
  const country = (h.get('x-vercel-ip-country') || h.get('cf-ipcountry') || h.get('cloudfront-viewer-country') || 'XX').toUpperCase().slice(0, 2);
  return {
    country: /^[A-Z]{2}$/.test(country) ? country : 'XX',
    region: dec(h.get('x-vercel-ip-country-region')).slice(0, 40),
    city: dec(h.get('x-vercel-ip-city')).slice(0, 60),
  };
}

export function getIp(h: Headers): string {
  const fwd = h.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0].trim() : h.get('x-real-ip') || '').slice(0, 64);
}

/**
 * Privacy by design: the full IP is never stored. We keep a masked copy for
 * the admin to eyeball (49.37.x.x — last two octets hidden; IPv6 keeps /32) and
 * a salted hash used only to count unique networks.
 */
export function maskIp(ip: string): string {
  if (!ip) return '';
  if (ip.includes(':')) return ip.split(':').slice(0, 2).join(':') + ':…';
  const p = ip.split('.');
  return p.length === 4 ? `${p[0]}.${p[1]}.x.x` : '';
}
export function hashIp(ip: string): string {
  return ip ? createHash('sha256').update(ip + (process.env.SESSION_SECRET ?? '')).digest('hex').slice(0, 16) : '';
}

export function flag(cc: string): string {
  if (!/^[A-Z]{2}$/.test(cc) || cc === 'XX') return '🌐';
  return String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0)));
}

export const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');
