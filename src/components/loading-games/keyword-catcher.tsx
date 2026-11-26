'use client';

import { useEffect, useRef } from 'react';

const GOOD = ['Led', 'Built', 'Optimised', 'Shipped', 'Automated', 'Designed', 'Deployed', 'Reduced', 'Analysed', 'Launched'];
const BAD = ['Typo', 'Table', 'Photo', 'Header img', 'Objective…', 'Responsible for', 'Comic Sans', '3 pages'];

interface Item { x: number; y: number; w: number; label: string; good: boolean; speed: number }

/**
 * ATS Keyword Catcher — slide the resume to catch Action Verbs (+10) and
 * dodge Recruiter Red Flags (lose a life). 3 lives, 45-second round.
 */
export default function KeywordCatcher({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cbs = useRef({ onScore, onRoundEnd });
  cbs.current = { onScore, onRoundEnd };

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const W = 360, H = 240;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    let px = W / 2, score = 0, lives = 3, over = false, t0 = performance.now(), last = t0, spawnAt = 0, raf = 0;
    const items: Item[] = [];
    const keys = { l: false, r: false };
    const PW = 64;

    const setX = (clientX: number) => {
      const r = canvas.getBoundingClientRect();
      px = Math.max(PW / 2, Math.min(W - PW / 2, ((clientX - r.left) / r.width) * W));
    };
    const onMove = (e: PointerEvent) => setX(e.clientX);
    const onKey = (e: KeyboardEvent, down: boolean) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keys.l = down;
      if (e.key === 'ArrowRight' || e.key === 'd') keys.r = down;
    };
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onMove);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);

    const finish = () => {
      if (over) return;
      over = true;
      cbs.current.onRoundEnd();
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = (now - t0) / 1000;

      if (!over) {
        if (keys.l) px = Math.max(PW / 2, px - 260 * dt);
        if (keys.r) px = Math.min(W - PW / 2, px + 260 * dt);
        if (now >= spawnAt) {
          const good = Math.random() > 0.38;
          const label = (good ? GOOD : BAD)[Math.floor(Math.random() * (good ? GOOD.length : BAD.length))];
          ctx.font = '600 12px system-ui, sans-serif';
          const w = ctx.measureText(label).width + 16;
          items.push({ x: 8 + Math.random() * (W - w - 16), y: -20, w, label, good, speed: 70 + Math.random() * 40 + elapsed * 1.6 });
          spawnAt = now + 650 - Math.min(300, elapsed * 5);
        }
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          it.y += it.speed * dt;
          const caught = it.y > H - 44 && it.y < H - 14 && it.x + it.w > px - PW / 2 && it.x < px + PW / 2;
          if (caught) {
            if (it.good) score += 10;
            else lives -= 1;
            cbs.current.onScore(score);
            items.splice(i, 1);
            if (lives <= 0) finish();
          } else if (it.y > H + 10) {
            items.splice(i, 1);
          }
        }
        if (elapsed >= 45) finish();
      }

      // draw
      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = 'middle';
      ctx.font = '600 12px system-ui, sans-serif';
      for (const it of items) {
        ctx.fillStyle = it.good ? 'rgba(34,197,94,0.92)' : 'rgba(239,68,68,0.92)';
        ctx.beginPath();
        ctx.roundRect(it.x, it.y - 11, it.w, 22, 11);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(it.label, it.x + 8, it.y);
      }
      // player: a tiny resume page
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#1d9bf0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(px - PW / 2, H - 42, PW, 28, 5);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1d9bf0';
      ctx.fillRect(px - PW / 2 + 8, H - 35, 28, 3);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(px - PW / 2 + 8, H - 28, 46, 2);
      ctx.fillRect(px - PW / 2 + 8, H - 23, 38, 2);
      // HUD
      ctx.fillStyle = 'rgba(127,127,127,0.9)';
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.fillText('♥'.repeat(Math.max(0, lives)), 8, 12);
      ctx.fillText(`${Math.max(0, 45 - Math.floor(elapsed))}s`, W - 30, 12);

      if (!over) raf = requestAnimationFrame(frame);
      else {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '700 18px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Round over — ${score} pts`, W / 2, H / 2);
        ctx.textAlign = 'start';
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      over = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onMove);
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [round]);

  return (
    <div>
      <canvas ref={ref} className="mx-auto block w-full max-w-[360px] touch-none rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)]" style={{ aspectRatio: '360 / 240' }} aria-label="Keyword catcher game: move the resume to catch green action verbs and dodge red flags" />
      <p className="mt-2 text-center text-[11px] text-[var(--fg-muted)]">Slide (mouse, touch or ← →) to catch <b className="text-emerald-500">action verbs</b>, dodge <b className="text-red-500">red flags</b>.</p>
    </div>
  );
}
