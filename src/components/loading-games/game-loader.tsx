'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Shuffle, Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GAMES } from './registry';

type GameId = string;

const AUTO_CONTINUE_SECONDS = 6;

function readBest(id: GameId) {
  try { return Number(localStorage.getItem(`qcv_best_${id}`) ?? 0) || 0; } catch { return 0; }
}
function writeBest(id: GameId, n: number) {
  try { localStorage.setItem(`qcv_best_${id}`, String(n)); } catch {}
}

/**
 * Interactive loading screen shown while the AI works. A randomly chosen
 * mini-game plays while a progress bar creeps toward ~92%. When the work is
 * done (status = 'ready') the bar snaps to 100% and the player can view the
 * results immediately, or finish the current round (auto-continues otherwise).
 */
export default function GameLoader({
  status,
  label,
  stages,
  onContinue,
}: {
  status: 'loading' | 'ready';
  label: string;
  stages: string[];
  onContinue: () => void;
}) {
  const [gameIdx, setGameIdx] = useState(0);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState(4);
  const [roundOver, setRoundOver] = useState(false);
  const [finishRound, setFinishRound] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_CONTINUE_SECONDS);
  const scoreRef = useRef(0);
  const continued = useRef(false);

  // pick a random game after mount (avoids SSR/hydration mismatch)
  useEffect(() => {
    setGameIdx(Math.floor(Math.random() * GAMES.length));
    setBest(Object.fromEntries(GAMES.map((g) => [g.id, readBest(g.id)])));
  }, []);

  // progress: ease toward 92% while loading, 100% when ready
  useEffect(() => {
    if (status === 'ready') { setProgress(100); return; }
    const t = setInterval(() => setProgress((p) => (p >= 92 ? p : p + Math.max(0.4, (92 - p) * 0.045))), 250);
    return () => clearInterval(t);
  }, [status]);

  const doContinue = useCallback(() => {
    if (continued.current) return;
    continued.current = true;
    onContinue();
  }, [onContinue]);

  // when ready: auto-continue unless the player chose to finish their round
  useEffect(() => {
    if (status !== 'ready' || finishRound || score > 0) return;
    setCountdown(AUTO_CONTINUE_SECONDS);
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [status, finishRound]);
  useEffect(() => {
    if (status === 'ready' && !finishRound && score === 0 && countdown <= 0) doContinue();
  }, [status, finishRound, score, countdown, doContinue]);

  const game = GAMES[gameIdx];
  const Game = game.C;
  const stageText = stages[Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length))];

  const handleScore = useCallback((n: number) => {
    scoreRef.current = n;
    setScore(n);
  }, []);

  const handleRoundEnd = useCallback(() => {
    setRoundOver(true);
    const id = GAMES[gameIdx].id;
    setBest((b) => {
      if (scoreRef.current > (b[id] ?? 0)) { writeBest(id, scoreRef.current); return { ...b, [id]: scoreRef.current }; }
      return b;
    });
    // "finish the current round" — once it ends, show the results
    setFinishRound((f) => { if (f) setTimeout(doContinue, 900); return f; });
  }, [gameIdx, doContinue]);

  function nextGame() {
    setGameIdx((i) => (i + 1) % GAMES.length);
    setRound((r) => r + 1);
    setScore(0); scoreRef.current = 0; setRoundOver(false);
  }
  function playAgain() { setRound((r) => r + 1); setScore(0); scoreRef.current = 0; setRoundOver(false); }

  const ready = status === 'ready';

  return (
    <div className="glass mx-auto w-full max-w-xl overflow-hidden" role="status" aria-live="polite">
      {/* progress */}
      <div className="px-5 pt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            {ready ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Loader2 size={14} className="animate-spin text-[var(--accent)]" />}
            {ready ? `${label} — done!` : `${stageText} ${Math.round(progress)}%`}
          </span>
          {ready && <span>{Math.round(progress)}%</span>}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* results-ready banner */}
      {ready && (
        <div className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3">
          <p className="text-xs font-semibold">
            Your results are ready{!finishRound && score === 0 && countdown > 0 ? ` — opening in ${countdown}s` : score > 0 && !finishRound ? ' — keep playing, open them whenever you like' : finishRound ? ' — finish your round, then we’ll open them' : ''}.
          </p>
          <div className="flex gap-2">
            {!finishRound && (
              <button onClick={() => setFinishRound(true)} className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-subtle)]">Finish this round</button>
            )}
            <button onClick={doContinue} className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[var(--accent-hover)]">
              View results now <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* game */}
      <div className="px-5 pb-5 pt-4">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="font-bold">{game.name}</span>
          <span className="flex items-center gap-3 text-[var(--fg-muted)]">
            <span>Score <b className="text-[var(--fg)]">{score}</b></span>
            <span className="flex items-center gap-1"><Trophy size={12} className="text-amber-500" /> Best <b className="text-[var(--fg)]">{best[game.id] ?? 0}</b></span>
          </span>
        </div>
        <Game key={`${game.id}-${round}`} round={round} onScore={handleScore} onRoundEnd={handleRoundEnd} />
        <div className="mt-3 flex justify-center gap-2">
          {roundOver && !ready && (
            <button onClick={playAgain} className="rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-white">Play again</button>
          )}
          <button onClick={nextGame} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--bg-subtle)]">
            <Shuffle size={12} /> Different game
          </button>
        </div>
      </div>
    </div>
  );
}
