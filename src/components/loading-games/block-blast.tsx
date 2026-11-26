'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const N = 8;
const SHAPES: string[][] = [
  ['1'], ['11'], ['111'], ['1111'], ['11111'], ['1', '1'], ['1', '1', '1'], ['1', '1', '1', '1'], ['1', '1', '1', '1', '1'],
  ['11', '11'], ['111', '111', '111'], ['111', '111'], ['11', '11', '11'],
  ['10', '11'], ['01', '11'], ['11', '10'], ['11', '01'],
  ['100', '100', '111'], ['001', '001', '111'], ['111', '100', '100'], ['111', '001', '001'],
  ['010', '111'], ['111', '010'], ['10', '11', '10'], ['01', '11', '01'], ['110', '011'], ['011', '110'],
];
const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1', '#d946ef', '#ec4899'];

interface Piece { shape: string[]; color: string }
type Grid = (string | null)[][];

const cells = (s: string[]) => s.flatMap((row, r) => [...row].map((ch, c) => (ch === '1' ? [r, c] as const : null)).filter(Boolean) as (readonly [number, number])[]);
const newPiece = (): Piece => ({ shape: SHAPES[Math.floor(Math.random() * SHAPES.length)], color: COLORS[Math.floor(Math.random() * COLORS.length)] });
const newSet = (): (Piece | null)[] => [newPiece(), newPiece(), newPiece()];
const emptyGrid = (): Grid => Array.from({ length: N }, () => Array(N).fill(null));

function fits(g: Grid, p: Piece, r0: number, c0: number) {
  return cells(p.shape).every(([r, c]) => { const y = r0 + r, x = c0 + c; return y >= 0 && x >= 0 && y < N && x < N && !g[y][x]; });
}
const anyFits = (g: Grid, ps: (Piece | null)[]) => ps.some((p) => p && Array.from({ length: N * N }, (_, i) => i).some((i) => fits(g, p, Math.floor(i / N), i % N)));

/** Block Blast — drag the three pieces onto the 8×8 board; complete rows/columns to clear them. */
export default function BlockBlast({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [pieces, setPieces] = useState<(Piece | null)[]>(newSet);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [over, setOver] = useState(false);
  const [drag, setDrag] = useState<{ i: number; x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const S = useRef({ grid, pieces, score, combo, over });
  S.current = { grid, pieces, score, combo, over };
  const dragRef = useRef(drag);
  dragRef.current = drag;

  useEffect(() => { setGrid(emptyGrid()); setPieces(newSet()); setScore(0); setCombo(0); setOver(false); setDrag(null); }, [round]);

  const LIFT = 64;
  const target = useCallback((d: { i: number; x: number; y: number }) => {
    const rect = boardRef.current?.getBoundingClientRect();
    const p = S.current.pieces[d.i];
    if (!rect || !p) return null;
    const cs = rect.width / N;
    const cols = Math.max(...p.shape.map((r) => r.length)), rows = p.shape.length;
    const c0 = Math.round((d.x - rect.left) / cs - cols / 2);
    const r0 = Math.round((d.y - LIFT - rect.top) / cs - rows / 2);
    return { r0, c0, ok: fits(S.current.grid, p, r0, c0), p };
  }, []);

  const place = useCallback((i: number, r0: number, c0: number) => {
    const { grid: g, pieces: ps, score: sc, combo: cb } = S.current;
    const p = ps[i]!;
    const ng = g.map((r) => [...r]);
    for (const [r, c] of cells(p.shape)) ng[r0 + r][c0 + c] = p.color;
    const fullRows = ng.map((r, y) => (r.every(Boolean) ? y : -1)).filter((y) => y >= 0);
    const fullCols = Array.from({ length: N }, (_, x) => x).filter((x) => ng.every((r) => r[x]));
    for (const y of fullRows) for (let x = 0; x < N; x++) ng[y][x] = null;
    for (const x of fullCols) for (let y = 0; y < N; y++) ng[y][x] = null;
    const lines = fullRows.length + fullCols.length;
    const newCombo = lines ? cb + 1 : 0;
    const gained = cells(p.shape).length + lines * 10 * (lines > 1 ? lines : 1) + (lines ? newCombo * 5 : 0);
    const total = sc + gained;
    let nps = ps.map((q, k) => (k === i ? null : q));
    if (nps.every((q) => !q)) nps = newSet();
    setGrid(ng); setPieces(nps); setScore(total); setCombo(newCombo);
    onScore(total);
    if (!anyFits(ng, nps)) { setOver(true); onRoundEnd(); }
  }, [onScore, onRoundEnd]);

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    const up = (e: PointerEvent) => {
      const d = dragRef.current;
      setDrag(null);
      if (!d) return;
      const t = target({ ...d, x: e.clientX, y: e.clientY });
      if (t?.ok) place(d.i, t.r0, t.c0);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [!!drag, target, place]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = drag ? target(drag) : null;
  const previewSet = new Set(preview?.ok ? cells(preview.p.shape).map(([r, c]) => `${preview.r0 + r},${preview.c0 + c}`) : []);
  const boardCell = boardRef.current ? boardRef.current.getBoundingClientRect().width / N : 36;

  return (
    <div className="select-none">
      <div className="mb-2 flex justify-between text-[11px] text-[var(--fg-muted)]"><span>Combo ×{combo}</span><span>{over ? 'No moves left!' : 'Drag pieces onto the board'}</span></div>
      <div ref={boardRef} className="mx-auto grid w-full max-w-[300px] gap-[2px] rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-[3px]" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {grid.flatMap((row, r) => row.map((v, c) => (
          <div key={`${r}-${c}`} className="aspect-square rounded-[4px] transition-colors" style={{ background: v ?? (previewSet.has(`${r},${c}`) ? `${preview!.p.color}88` : 'rgba(127,127,127,0.16)') }} />
        )))}
      </div>
      <div className="mx-auto mt-4 flex max-w-[300px] items-center justify-around rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] py-3" style={{ minHeight: 96 }}>
        {pieces.map((p, i) => (
          <div key={i} className="flex h-[80px] w-[80px] items-center justify-center touch-none" onPointerDown={(e) => { if (!p || over) return; e.preventDefault(); setDrag({ i, x: e.clientX, y: e.clientY }); }}>
            {p && (
              <div className="grid gap-[2px]" style={{ opacity: drag?.i === i ? 0.3 : 1, gridTemplateColumns: `repeat(${p.shape[0].length}, 16px)`, cursor: 'grab' }}>
                {p.shape.flatMap((row, r) => [...row].map((ch, c) => <div key={`${r}${c}`} style={{ width: 16, height: 16, borderRadius: 3, background: ch === '1' ? p.color : 'transparent' }} />))}
              </div>
            )}
          </div>
        ))}
      </div>
      {drag && pieces[drag.i] && (
        <div className="pointer-events-none fixed z-[100] grid gap-[2px]" style={{ left: drag.x, top: drag.y - LIFT, transform: 'translate(-50%,-50%)', gridTemplateColumns: `repeat(${pieces[drag.i]!.shape[0].length}, ${boardCell - 2}px)` }}>
          {pieces[drag.i]!.shape.flatMap((row, r) => [...row].map((ch, c) => <div key={`${r}${c}`} style={{ width: boardCell - 2, height: boardCell - 2, borderRadius: 4, background: ch === '1' ? pieces[drag.i]!.color : 'transparent', boxShadow: ch === '1' ? '0 4px 12px rgba(0,0,0,.3)' : undefined }} />))}
        </div>
      )}
      <p className="mt-2 text-center text-[11px] text-[var(--fg-muted)]">Score {score} — clear several lines at once for big combos.</p>
    </div>
  );
}
