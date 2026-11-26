'use client';

import { useEffect, useRef } from 'react';

interface Obs { x: number; w: number; h: number; flag: boolean }

/** Sky Runner — endless runner. Tap / Space / ↑ to jump over red flags; speeds up forever. */
export default function SkyRunner({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cbs = useRef({ onScore, onRoundEnd });
  cbs.current = { onScore, onRoundEnd };

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const W = 360, H = 240, GY = H - 40, PX = 60, PW = 22, PH = 36;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);

    let py = GY - PH, vy = 0, onGround = true, dist = 0, speed = 280, over = false, shown = -1, raf = 0, last = performance.now(), nextGap = 300, run = 0;
    const obs: Obs[] = [];
    const clouds = Array.from({ length: 4 }, (_, i) => ({ x: i * 100, y: 20 + Math.random() * 60 }));

    const jump = () => { if (over) return; if (onGround) { vy = -520; onGround = false; } };
    const onPtr = (e: PointerEvent) => { e.preventDefault(); jump(); };
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } };
    canvas.addEventListener('pointerdown', onPtr);
    window.addEventListener('keydown', onKey);

    const frame = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      if (!over) {
        speed = Math.min(620, 280 + dist / 45);
        dist += speed * dt; run += dt * speed * 0.05;
        vy += 1500 * dt; py += vy * dt;
        if (py >= GY - PH) { py = GY - PH; vy = 0; onGround = true; }
        nextGap -= speed * dt;
        if (nextGap <= 0) {
          const n = Math.random() < 0.25 ? 2 : 1;
          for (let i = 0; i < n; i++) { const h = 26 + Math.random() * 26; obs.push({ x: W + 20 + i * 24, w: 16, h, flag: Math.random() < 0.5 }); }
          nextGap = speed * (0.85 + Math.random() * 0.7) + 120;
        }
        for (let i = obs.length - 1; i >= 0; i--) {
          const o = obs[i]; o.x -= speed * dt;
          if (o.x < -40) { obs.splice(i, 1); continue; }
          if (PX + PW - 5 > o.x + 2 && PX + 5 < o.x + o.w - 2 && py + PH - 3 > GY - o.h) { over = true; cbs.current.onRoundEnd(); }
        }
        for (const c of clouds) { c.x -= speed * dt * 0.15; if (c.x < -40) { c.x = W + 20; c.y = 20 + Math.random() * 60; } }
        const s = Math.floor(dist / 10);
        if (s !== shown) { shown = s; cbs.current.onScore(s); }
      }

      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7dd3fc'); g.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (const c of clouds) { ctx.beginPath(); ctx.arc(c.x, c.y, 12, 0, 7); ctx.arc(c.x + 14, c.y + 3, 9, 0, 7); ctx.arc(c.x - 12, c.y + 4, 8, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#a3e635'; ctx.fillRect(0, GY, W, H - GY);
      ctx.fillStyle = '#65a30d'; for (let x = -((dist) % 30); x < W; x += 30) ctx.fillRect(x, GY + 6, 14, 3);

      for (const o of obs) {
        ctx.fillStyle = '#7f1d1d'; ctx.fillRect(o.x + 6, GY - o.h, 3, o.h);
        ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(o.x + 9, GY - o.h); ctx.lineTo(o.x + 9 + 14, GY - o.h + 7); ctx.lineTo(o.x + 9, GY - o.h + 14); ctx.fill();
      }
      // runner
      const leg = onGround ? Math.sin(run * 2) * 5 : 0;
      ctx.fillStyle = '#0f172a'; ctx.fillRect(PX + 4, py + PH - 10, 5, 10 + leg * 0.4); ctx.fillRect(PX + 13, py + PH - 10, 5, 10 - leg * 0.4);
      ctx.fillStyle = '#1d9bf0'; ctx.beginPath(); ctx.roundRect(PX, py + 8, PW, PH - 16, 6); ctx.fill();
      ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(PX + PW / 2, py + 6, 8, 0, 7); ctx.fill();
      ctx.fillStyle = '#0f172a'; ctx.fillRect(PX + PW / 2 + 1, py + 4, 3, 3);

      ctx.fillStyle = '#0f172a'; ctx.font = '800 16px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText(String(Math.floor(dist / 10)).padStart(5, '0'), W - 10, 10);
      if (over) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 22px system-ui'; ctx.fillText('Tripped on a red flag!', W / 2, H / 2); }
      else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onPtr); window.removeEventListener('keydown', onKey); };
  }, [round]);

  return (
    <div>
      <canvas ref={ref} className="mx-auto block w-full max-w-[380px] touch-none rounded-xl border border-[var(--border)]" style={{ aspectRatio: '360 / 240' }} aria-label="Sky runner: tap to jump" />
      <p className="mt-2 text-center text-[11px] text-[var(--fg-muted)]">Tap / Space / ↑ to jump over the red flags. It never stops speeding up.</p>
    </div>
  );
}
