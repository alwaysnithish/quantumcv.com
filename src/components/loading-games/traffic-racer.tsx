'use client';

import { useEffect, useRef } from 'react';

interface Car { lane: number; y: number; own: number; color: string }
interface Coin { lane: number; y: number }

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#14b8a6', '#ec4899', '#64748b'];

/** Traffic Racer — endless 4-lane racing. Drag / tap / ← → to change lanes, grab coins, don't crash. */
export default function TrafficRacer({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cbs = useRef({ onScore, onRoundEnd });
  cbs.current = { onScore, onRoundEnd };

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const W = 320, H = 460, LANES = 4, LW = W / LANES, CW = 38, CH = 64;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let lane = 1, px = LW * 1.5, dist = 0, coins = 0, over = false, spawnT = 0, coinT = 2, shown = -1, raf = 0, last = performance.now(), roadOff = 0, speed = 220, t = 0;
    const cars: Car[] = [];
    const cs: Coin[] = [];

    const laneFromX = (clientX: number) => {
      const r = canvas.getBoundingClientRect();
      return Math.max(0, Math.min(LANES - 1, Math.floor(((clientX - r.left) / r.width) * LANES)));
    };
    const onPtr = (e: PointerEvent) => { lane = laneFromX(e.clientX); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') { lane = Math.max(0, lane - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd') { lane = Math.min(LANES - 1, lane + 1); e.preventDefault(); }
    };
    canvas.addEventListener('pointerdown', onPtr);
    canvas.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') onPtr(e); });
    window.addEventListener('keydown', onKey);

    const drawCar = (x: number, y: number, color: string, player = false) => {
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.roundRect(x - CW / 2 + 3, y - CH / 2 + 4, CW, CH, 9); ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(x - CW / 2, y - CH / 2, CW, CH, 9); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath(); ctx.roundRect(x - CW / 2 + 6, y - CH / 2 + (player ? 12 : 30), CW - 12, 16, 4); ctx.fill();
      ctx.fillStyle = player ? '#fde047' : '#fca5a5';
      ctx.fillRect(x - CW / 2 + 4, y - CH / 2 + (player ? 2 : CH - 6), 8, 4);
      ctx.fillRect(x + CW / 2 - 12, y - CH / 2 + (player ? 2 : CH - 6), 8, 4);
    };

    const finish = () => { if (!over) { over = true; cbs.current.onRoundEnd(); } };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!over) {
        t += dt;
        speed = Math.min(560, 220 + t * 7);
        dist += speed * dt;
        roadOff = (roadOff + speed * dt) % 40;
        px += (LW * (lane + 0.5) - px) * Math.min(1, dt * 14);

        spawnT -= dt;
        if (spawnT <= 0) {
          const occupied = new Set(cars.filter((c) => c.y < 150).map((c) => c.lane));
          const free = [0, 1, 2, 3].filter((l) => !occupied.has(l));
          if (free.length >= 2) {
            cars.push({ lane: free[Math.floor(Math.random() * free.length)], y: -CH, own: 70 + Math.random() * 90, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
          }
          spawnT = Math.max(0.38, 0.95 - t * 0.012);
        }
        coinT -= dt;
        if (coinT <= 0) { cs.push({ lane: Math.floor(Math.random() * LANES), y: -20 }); coinT = 1.4 + Math.random() * 1.4; }

        const py = H - 90;
        for (let i = cars.length - 1; i >= 0; i--) {
          const c = cars[i];
          c.y += (speed - c.own) * dt;
          if (c.y > H + CH) { cars.splice(i, 1); continue; }
          const cx = LW * (c.lane + 0.5);
          if (Math.abs(cx - px) < CW - 6 && Math.abs(c.y - py) < CH - 8) finish();
        }
        for (let i = cs.length - 1; i >= 0; i--) {
          const c = cs[i];
          c.y += speed * dt;
          if (c.y > H + 20) { cs.splice(i, 1); continue; }
          if (Math.abs(LW * (c.lane + 0.5) - px) < 28 && Math.abs(c.y - py) < 40) { coins++; cs.splice(i, 1); }
        }
        const score = Math.floor(dist / 12) + coins * 10;
        if (score !== shown) { shown = score; cbs.current.onScore(score); }
      }

      // road
      ctx.fillStyle = '#334155';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 6, H); ctx.fillRect(W - 6, 0, 6, H);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let l = 1; l < LANES; l++) for (let y = -40 + roadOff; y < H; y += 40) ctx.fillRect(l * LW - 2, y, 4, 22);
      for (const c of cs) {
        const x = LW * (c.lane + 0.5);
        ctx.fillStyle = '#facc15'; ctx.beginPath(); ctx.arc(x, c.y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a16207'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', x, c.y + 1);
      }
      for (const c of cars) drawCar(LW * (c.lane + 0.5), c.y, c.color);
      drawCar(px, H - 90, '#1d9bf0', true);
      ctx.fillStyle = '#fff'; ctx.font = '700 13px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(`${Math.round(speed / 3)} km/h`, 12, 10);
      ctx.textAlign = 'right'; ctx.fillText(`🪙 ${coins}`, W - 12, 10);
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = '800 26px system-ui'; ctx.fillText('CRASH!', W / 2, H / 2 - 12);
        ctx.font = '600 14px system-ui'; ctx.fillText(`${Math.floor(dist / 12) + coins * 10} pts`, W / 2, H / 2 + 18);
      } else raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onPtr); window.removeEventListener('keydown', onKey); };
  }, [round]);

  return (
    <div>
      <canvas ref={ref} className="mx-auto block w-full max-w-[300px] touch-none rounded-xl border border-[var(--border)]" style={{ aspectRatio: '320 / 460' }} aria-label="Traffic racer: tap or drag to change lanes" />
      <p className="mt-2 text-center text-[11px] text-[var(--fg-muted)]">Tap / drag / ← → to switch lanes. Grab 🪙, avoid traffic. It gets faster!</p>
    </div>
  );
}
