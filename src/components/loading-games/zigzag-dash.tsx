'use client';

import { useEffect, useRef } from 'react';

interface Pt { x: number; y: number }

/** Zigzag Dash — the ball runs diagonally; tap to switch direction and stay on the twisting road. Endless. */
export default function ZigzagDash({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cbs = useRef({ onScore, onRoundEnd });
  cbs.current = { onScore, onRoundEnd };

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const W = 320, H = 460, HALF = 24, S2 = Math.SQRT1_2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);

    const pts: Pt[] = [{ x: W / 2, y: -40 }, { x: W / 2, y: 0 }];
    let sign = 1;
    const extend = (upTo: number) => {
      while (pts[pts.length - 1].y < upTo) {
        const p = pts[pts.length - 1];
        let room = sign > 0 ? W - 44 - p.x : p.x - 44;
        if (room < 50) { sign = -sign; room = sign > 0 ? W - 44 - p.x : p.x - 44; }
        const len = Math.min(room, 60 + Math.random() * 120);
        pts.push({ x: p.x + sign * len, y: p.y + len });
        sign = -sign;
      }
    };
    extend(900);

    let x = W / 2, y = 0, dir = 1, over = false, dist = 0, shown = -1, raf = 0, last = performance.now(), fall = 0;
    const flip = () => { if (!over) dir = -dir; };
    const onPtr = (e: PointerEvent) => { e.preventDefault(); flip(); };
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key.startsWith('Arrow')) { e.preventDefault(); flip(); } };
    canvas.addEventListener('pointerdown', onPtr);
    window.addEventListener('keydown', onKey);

    const dSeg = (px: number, py: number, a: Pt, b: Pt) => {
      const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2));
      return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
    };

    const frame = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      if (!over) {
        const speed = 170 + Math.min(150, dist / 25);
        x += dir * S2 * speed * dt; y += S2 * speed * dt; dist += speed * dt;
        extend(y + 900);
        while (pts.length > 6 && pts[2].y < y - 300) pts.shift();
        let min = Infinity;
        for (let i = 1; i < pts.length; i++) { if (pts[i].y < y - 60) continue; if (pts[i - 1].y > y + 60) break; min = Math.min(min, dSeg(x, y, pts[i - 1], pts[i])); }
        if (min > HALF - 3) { over = true; cbs.current.onRoundEnd(); }
        const s = Math.floor(dist / 10);
        if (s !== shown) { shown = s; cbs.current.onScore(s); }
      } else fall += dt * 300;

      const hue = (200 + dist / 12) % 360;
      ctx.fillStyle = `hsl(${hue},45%,16%)`; ctx.fillRect(0, 0, W, H);
      const sy = (wy: number) => H * 0.7 - (wy - y);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = `hsl(${hue},70%,55%)`; ctx.lineWidth = HALF * 2;
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, sy(p.y)) : ctx.moveTo(p.x, sy(p.y)))); ctx.stroke();
      ctx.strokeStyle = `hsl(${hue},80%,72%)`; ctx.lineWidth = 3; ctx.setLineDash([2, 14]);
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, sy(p.y)) : ctx.moveTo(p.x, sy(p.y)))); ctx.stroke(); ctx.setLineDash([]);

      const r = over ? Math.max(0, 9 - fall / 12) : 9;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(x + 3, H * 0.7 + 4 + (over ? fall : 0), r, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, H * 0.7 + (over ? fall : 0), r, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '800 34px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(String(Math.floor(dist / 10)), W / 2, 14);
      if (over) { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.font = '800 24px system-ui'; ctx.fillText('Off the road!', W / 2, H / 2); }
      if (!over || fall < 140) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onPtr); window.removeEventListener('keydown', onKey); };
  }, [round]);

  return (
    <div>
      <canvas ref={ref} className="mx-auto block w-full max-w-[300px] touch-none rounded-xl border border-[var(--border)]" style={{ aspectRatio: '320 / 460' }} aria-label="Zigzag dash: tap to switch direction" />
      <p className="mt-2 text-center text-[11px] text-[var(--fg-muted)]">Tap / Space to switch direction at every corner. Don’t fall off!</p>
    </div>
  );
}
