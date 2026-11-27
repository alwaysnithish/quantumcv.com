'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * First-party, cookieless-by-default analytics beacon. Records page views,
 * ACTIVE time on page (visible tab + recent interaction), scroll depth and
 * clicks on links/buttons. Sends nothing for /admin, when Do-Not-Track /
 * Global Privacy Control is on, or when the admin opt-out cookie is set.
 * No form values or text input are ever read.
 */

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

function optedOut() {
  try {
    if (navigator.doNotTrack === '1' || (navigator as any).globalPrivacyControl) return true;
    return document.cookie.split('; ').some((c) => c === 'qcv_notrack=1');
  } catch { return false; }
}

function ids() {
  let vid = '', sid = '', entry = false;
  try {
    vid = localStorage.getItem('qcv_vid') ?? '';
    if (!vid) { vid = uid(); localStorage.setItem('qcv_vid', vid); }
    document.cookie = `qcv_vid=${vid}; max-age=31536000; path=/; samesite=lax`; // lets the server tie signups/scans to the visit
    const raw = localStorage.getItem('qcv_sid');
    const s = raw ? JSON.parse(raw) : null;
    if (s && Date.now() - s.t < 30 * 60 * 1000) sid = s.id;
    else { sid = uid(); entry = true; }
    localStorage.setItem('qcv_sid', JSON.stringify({ id: sid, t: Date.now() }));
  } catch { vid = vid || uid(); sid = sid || uid(); entry = true; }
  return { vid, sid, entry };
}

function send(body: object) {
  const data = JSON.stringify(body);
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/collect', new Blob([data], { type: 'text/plain' }))) return;
  } catch {}
  fetch('/api/collect', { method: 'POST', body: data, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {});
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || optedOut()) return;

    const { vid, sid, entry } = ids();
    const pvid = uid();
    const q = new URLSearchParams(location.search);
    send({
      t: 'pv', vid, sid, pvid, entry, path: pathname, title: document.title, ref: entry ? document.referrer : '',
      sw: window.innerWidth, lang: navigator.language,
      us: q.get('utm_source') ?? '', um: q.get('utm_medium') ?? '', uc: q.get('utm_campaign') ?? '',
    });

    let active = 0, maxScroll = 0, lastInput = Date.now(), lastSent = -1;
    const pingNow = () => { if (active !== lastSent) { lastSent = active; send({ t: 'ping', vid, sid, pvid, dur: active, scroll: maxScroll }); } };
    const bump = () => { lastInput = Date.now(); };
    const onScroll = () => {
      bump();
      const el = document.documentElement;
      const pct = Math.round(((window.scrollY + window.innerHeight) / Math.max(el.scrollHeight, 1)) * 100);
      if (pct > maxScroll) maxScroll = Math.min(100, pct);
    };
    onScroll();

    // active-time ticker: counts only while the tab is visible and the user did something in the last 60s
    const tick = setInterval(() => { if (document.visibilityState === 'visible' && Date.now() - lastInput < 60000) active++; }, 1000);
    const heartbeat = setInterval(() => { if (document.visibilityState === 'visible') { try { localStorage.setItem('qcv_sid', JSON.stringify({ id: sid, t: Date.now() })); } catch {} send({ t: 'ping', vid, sid, pvid, dur: active, scroll: maxScroll }); lastSent = active; } }, 15000);
    const onHide = () => pingNow();
    const onVis = () => { if (document.visibilityState === 'hidden') pingNow(); };

    const onClick = (e: MouseEvent) => {
      bump();
      const el = (e.target as HTMLElement | null)?.closest?.('a,button,[data-track]') as HTMLElement | null;
      if (!el) return;
      const a = el.closest('a') as HTMLAnchorElement | null;
      const label = (el.getAttribute('data-track') || el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 80);
      if (!label && !a?.href) return;
      let href = '', out = false;
      if (a?.href) { try { const u = new URL(a.href, location.href); out = u.host !== location.host; href = out ? u.origin + u.pathname : u.pathname + u.hash; } catch {} }
      send({ t: 'click', vid, sid, pvid, path: pathname, label, href, out });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', bump, { passive: true });
    window.addEventListener('keydown', bump);
    window.addEventListener('touchstart', bump, { passive: true });
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('click', onClick, true);

    return () => {
      clearInterval(tick); clearInterval(heartbeat);
      pingNow(); // leaving this page (route change)
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', bump);
      window.removeEventListener('keydown', bump);
      window.removeEventListener('touchstart', bump);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('click', onClick, true);
    };
  }, [pathname]);

  return null;
}
