'use client';

import { useEffect, useRef } from 'react';

/** Flappy Resume — tap to flap through the gaps between rejection-letter towers. Endless. */
export default function FlappyResume({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cbs = useRef({ onScore, onRoundEnd });
  cbs.current = { onScore, onRoundEnd };

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const W = 320, H = 460, GROUND = 36, PW = 54, R = 13;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.scale(dpr, dpr);

    let y = H / 2 - 20, vy = 0, started = false, over = false, score = 0, raf = 0, last = performance.now(), t = 0, groundOff = 0;
    const pipes: { x: number; gap: number; passed: boolean }[] = [];
    const gapSize = () => Math.max(108, 150 - score * 1.2);
    const addPipe = (x: number) => pipes.push({ x, gap: 90 + Math.random() * (H - GROUND - 180), passed: false });
    addPipe(W + 60);

    const flap = () => { if (over) return; started = true; vy = -300; };
    const onPtr = (e: PointerEvent) => { e.preventDefault(); flap(); };
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); flap(); } };
    canvas.addEventListener('pointerdown', onPtr);
    window.addEventListener('keydown', onKey);

    const finish = () => { if (!over) { over = true; cbs.current.onRoundEnd(); } };

    const frame = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000); last = now; t += dt;
      const speed = Math.min(210, 120 + score * 3);
      if (!over) {
        if (started) {
          vy += 820 * dt; y += vy * dt;
          groundOff = (groundOff + speed * dt) % 24;
          for (const p of pipes) p.x -= speed * dt;
          if (pipes[pipes.length - 1].x < W - 200) addPipe(W + 20);
          if (pipes[0].x < -PW - 10) pipes.shift();
          for (const p of pipes) {
            if (!p.passed && p.x + PW < 90 - R) { p.passed = true; score++; cbs.current.onScore(score); }
            const gs = gapSize();
            if (90 + R > p.x && 90 - R < p.x + PW && (y - R < p.gap - gs / 2 || y + R > p.gap + gs / 2)) finish();
          }
          if (y + R > H - GROUND || y - R < 0) finish();
        } else y = H / 2 - 20 + Math.sin(t * 4) * 6;
      }

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#38bdf8'); g.addColorStop(1, '#bae6fd');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (const [cx, cy, s] of [[50, 70, 1], [200, 120, 0.8], [290, 50, 0.6]] as const) { ctx.beginPath(); ctx.arc(cx, cy, 16 * s, 0, 7); ctx.arc(cx + 18 * s, cy + 4, 12 * s, 0, 7); ctx.arc(cx - 16 * s, cy + 5, 11 * s, 0, 7); ctx.fill(); }

      const gs = gapSize();
      for (const p of pipes) {
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(p.x, 0, PW, p.gap - gs / 2);
        ctx.fillRect(p.x, p.gap + gs / 2, PW, H);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(p.x - 4, p.gap - gs / 2 - 16, PW + 8, 16);
        ctx.fillRect(p.x - 4, p.gap + gs / 2, PW + 8, 16);
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '700 9px system-ui'; ctx.textAlign = 'center';
        ctx.fillText('REJECTED', p.x + PW / 2, Math.max(12, p.gap - gs / 2 - 24));
      }
      ctx.fillStyle = '#84cc16'; ctx.fillRect(0, H - GROUND, W, GROUND);
      ctx.fillStyle = '#65a30d';
      for (let x = -24 + groundOff * -1; x < W; x += 24) ctx.fillRect(x, H - GROUND, 12, 8);

      ctx.save(); ctx.translate(90, y); ctx.rotate(Math.max(-0.5, Math.min(1, vy / 500)));
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1d9bf0'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(-R + 1, -R - 3, R * 2 - 2, R * 2 + 6, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1d9bf0'; ctx.fillRect(-R + 5, -R + 1, 12, 3);
      ctx.fillStyle = '#cbd5e1'; ctx.fillRect(-R + 5, -R + 7, 14, 2); ctx.fillRect(-R + 5, -R + 12, 10, 2);
      ctx.restore();

      ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4; ctx.font = '800 36px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.strokeText(String(score), W / 2, 16); ctx.fillText(String(score), W / 2, 16);
      if (!started) { ctx.font = '700 14px system-ui'; ctx.fillStyle = '#0f172a'; ctx.fillText('Tap to flap', W / 2, H / 2 + 20); }
      if (over) { ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.font = '800 24px system-ui'; ctx.fillText(`Rejected! ${score} pts`, W / 2, H / 2); }
      else raf = requestAnimationFrame(frame);
      if (over) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(frame);
    return () => { over = true; cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onPtr); window.removeEventListener('keydown', onKey); };
  }, [round]);

  return (
    <div>
      <canvas ref={ref} className="mx-auto block w-full max-w-[300px] touch-none rounded-xl border border-[var(--border)]" style={{ aspectRatio: '320 / 460' }} aria-label="Flappy Resume: tap to flap" />
      <p className="mt-2 text-center text-[11px] text-[var(--fg-muted)]">Tap / Space to flap. Slip through the gaps between rejection letters.</p>
    </div>
  );
}
