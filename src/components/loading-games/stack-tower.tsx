'use client';

import { useEffect, useRef } from 'react';

interface Block { x: number; w: number }

/** Stack Tower — tap to drop the sliding block; only the overlap survives. Perfect drops keep your width. */
export default function StackTower({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cbs = useRef({ onScore, onRoundEnd });
  cbs.current = { onScore, onRoundEnd };

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const W = 320, H = 460, BH = 24;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const stack: Block[] = [{ x: (W - 170) / 2, w: 170 }];
    let cur: Block = { x: 0, w: 170 }, dir = 1, speed = 150, score = 0, over = false, cam = 0, flash = 0, perfectStreak = 0, raf = 0, last = performance.now();
    const falling: { x: number; y: number; w: number; vy: number; hue: number }[] = [];
    const hue = (i: number) => (200 + i * 14) % 360;

    const drop = () => {
      if (over) return;
      const top = stack[stack.length - 1];
      const left = Math.max(cur.x, top.x);
      const right = Math.min(cur.x + cur.w, top.x + top.w);
      const ov = right - left;
      if (ov <= 0) {
        over = true;
        falling.push({ x: cur.x, y: H - BH * (stack.length + 1) + cam, w: cur.w, vy: 0, hue: hue(stack.length) });
        cbs.current.onRoundEnd();
        return;
      }
      let nb: Block;
      if (Math.abs(cur.x - top.x) < 5) {
        nb = { x: top.x, w: top.w };
        perfectStreak++;
        score += 2;
        flash = 1;
        if (perfectStreak >= 3) nb.w = Math.min(170, nb.w + 8); // reward streaks
      } else {
        nb = { x: left, w: ov };
        perfectStreak = 0;
        score += 1;
        const cutW = cur.w - ov;
        falling.push({ x: cur.x < top.x ? cur.x : right, y: H - BH * (stack.length + 1) + cam, w: cutW, vy: 0, hue: hue(stack.length) });
      }
      stack.push(nb);
      cbs.current.onScore(score);
      cur = { x: dir > 0 ? 0 : W - nb.w, w: nb.w };
      speed = Math.min(380, 150 + stack.length * 6);
    };

    const onPtr = (e: PointerEvent) => { e.preventDefault(); drop(); };
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); drop(); } };
    canvas.addEventListener('pointerdown', onPtr);
    window.addEventListener('keydown', onKey);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!over) {
        cur.x += dir * speed * dt;
        if (cur.x + cur.w > W) { cur.x = W - cur.w; dir = -1; }
        if (cur.x < 0) { cur.x = 0; dir = 1; }
      }
      const targetCam = Math.max(0, (stack.length - 8) * BH);
      cam += (targetCam - cam) * Math.min(1, dt * 6);
      flash = Math.max(0, flash - dt * 3);

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `hsl(${(220 + stack.length * 3) % 360},70%,18%)`);
      g.addColorStop(1, `hsl(${(250 + stack.length * 3) % 360},60%,35%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      stack.forEach((b, i) => {
        const y = H - BH * (i + 1) + cam;
        if (y > H || y < -BH) return;
        ctx.fillStyle = `hsl(${hue(i)},75%,${55 + (i === stack.length - 1 ? flash * 15 : 0)}%)`;
        ctx.beginPath(); ctx.roundRect(b.x, y, b.w, BH - 2, 4); ctx.fill();
      });
      if (!over) {
        const y = H - BH * (stack.length + 1) + cam;
        ctx.fillStyle = `hsl(${hue(stack.length)},80%,62%)`;
        ctx.beginPath(); ctx.roundRect(cur.x, y, cur.w, BH - 2, 4); ctx.fill();
      }
      for (let i = falling.length - 1; i >= 0; i--) {
        const f = falling[i];
        f.vy += 900 * dt; f.y += f.vy * dt;
        ctx.fillStyle = `hsl(${f.hue},70%,50%)`;
        ctx.beginPath(); ctx.roundRect(f.x, f.y, f.w, BH - 2, 4); ctx.fill();
        if (f.y > H + 40) falling.splice(i, 1);
      }
      ctx.fillStyle = '#fff'; ctx.font = '800 34px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(String(score), W / 2, 14);
      if (perfectStreak > 0) { ctx.font = '700 12px system-ui'; ctx.fillStyle = '#fde047'; ctx.fillText(`PERFECT ×${perfectStreak}`, W / 2, 56); }
      if (over) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.font = '800 24px system-ui';
        ctx.fillText(`Tower: ${score} pts`, W / 2, H / 2);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onPtr); window.removeEventListener('keydown', onKey); };
  }, [round]);

  return (
    <div>
      <canvas ref={ref} className="mx-auto block w-full max-w-[300px] touch-none rounded-xl border border-[var(--border)]" style={{ aspectRatio: '320 / 460' }} aria-label="Stack tower: tap to drop the block" />
      <p className="mt-2 text-center text-[11px] text-[var(--fg-muted)]">Tap (or Space) to drop. Line it up perfectly to keep your width!</p>
    </div>
  );
}
