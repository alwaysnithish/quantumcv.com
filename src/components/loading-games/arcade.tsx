'use client';

import { useCallback, useEffect, useState } from 'react';
import { Trophy, Gamepad2, ArrowLeft } from 'lucide-react';
import AppWindow from '@/components/win/app-window';
import { GAMES } from './registry';

const readBest = (id: string) => { try { return Number(localStorage.getItem(`qcv_best_${id}`) ?? 0) || 0; } catch { return 0; } };

/** Always-on arcade: pick any game from the grid, play any time. */
export default function Arcade() {
  const [idx, setIdx] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [best, setBest] = useState<Record<string, number>>({});

  useEffect(() => { setBest(Object.fromEntries(GAMES.map((g) => [g.id, readBest(g.id)]))); }, [idx]);

  const onScore = useCallback((n: number) => setScore(n), []);
  const onRoundEnd = useCallback(() => {
    setOver(true);
    setScore((s) => {
      if (idx !== null && s > readBest(GAMES[idx].id)) { try { localStorage.setItem(`qcv_best_${GAMES[idx].id}`, String(s)); } catch {} setBest((b) => ({ ...b, [GAMES[idx].id]: s })); }
      return s;
    });
  }, [idx]);

  const g = idx !== null ? GAMES[idx] : null;

  return (
    <AppWindow title="QuantumCV Arcade" icon={<Gamepad2 size={14} className="text-[var(--accent)]" />}>
      <div className="p-5 sm:p-7">
        {!g && (
          <div className="grid gap-3 sm:grid-cols-2">
            {GAMES.map((x, i) => (
              <button key={x.id} onClick={() => { setIdx(i); setRound((r) => r + 1); setScore(0); setOver(false); }} className="group rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-left transition-transform hover:-translate-y-0.5 hover:border-[var(--accent)]">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{x.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{x.name}</div>
                    <span className="rounded-full bg-[var(--accent)]/12 px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--accent)]">{x.category}</span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)]"><Trophy size={11} className="text-amber-500" />{best[x.id] ?? 0}</span>
                </div>
                <p className="mt-2 text-xs text-[var(--fg-muted)]">{x.blurb}</p>
              </button>
            ))}
          </div>
        )}
        {g && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => setIdx(null)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"><ArrowLeft size={14} /> All games</button>
              <span className="text-sm font-bold">{g.emoji} {g.name}</span>
              <span className="flex items-center gap-3 text-xs text-[var(--fg-muted)]">Score <b className="text-[var(--fg)]">{score}</b><Trophy size={12} className="text-amber-500" /><b className="text-[var(--fg)]">{best[g.id] ?? 0}</b></span>
            </div>
            <g.C key={`${g.id}-${round}`} round={round} onScore={onScore} onRoundEnd={onRoundEnd} />
            {over && <div className="mt-4 text-center"><button onClick={() => { setRound((r) => r + 1); setScore(0); setOver(false); }} className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-bold text-white">Play again</button></div>}
          </>
        )}
      </div>
    </AppWindow>
  );
}
