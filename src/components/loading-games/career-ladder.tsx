'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const LABELS: Record<number, string> = { 2: 'Intern', 4: 'Junior', 8: 'Mid', 16: 'Senior', 32: 'Lead', 64: 'Manager', 128: 'Director', 256: 'VP', 512: 'CTO', 1024: 'CEO', 2048: 'Founder' };
const COLORS: Record<number, string> = { 2: '#94a3b8', 4: '#64b5f6', 8: '#4f9df0', 16: '#1d9bf0', 32: '#7c6cf0', 64: '#a855f7', 128: '#ec4899', 256: '#f97316', 512: '#eab308', 1024: '#22c55e', 2048: '#14b8a6' };

type Board = number[][];
const empty = (): Board => Array.from({ length: 4 }, () => Array(4).fill(0));

function addTile(b: Board): Board {
  const cells: [number, number][] = [];
  b.forEach((r, i) => r.forEach((v, j) => !v && cells.push([i, j])));
  if (!cells.length) return b;
  const [i, j] = cells[Math.floor(Math.random() * cells.length)];
  const n = b.map((r) => [...r]);
  n[i][j] = Math.random() < 0.9 ? 2 : 4;
  return n;
}

function slideRow(row: number[]): { row: number[]; gained: number } {
  const tiles = row.filter(Boolean);
  let gained = 0;
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] === tiles[i + 1]) {
      tiles[i] *= 2;
      gained += tiles[i];
      tiles.splice(i + 1, 1);
    }
  }
  while (tiles.length < 4) tiles.push(0);
  return { row: tiles, gained };
}

function move(b: Board, dir: 'left' | 'right' | 'up' | 'down'): { board: Board; gained: number; moved: boolean } {
  const rotate = (m: Board) => m[0].map((_, c) => m.map((r) => r[c]).reverse()); // 90° clockwise
  let times = { left: 0, down: 1, right: 2, up: 3 }[dir];
  let m = b.map((r) => [...r]);
  for (let i = 0; i < times; i++) m = rotate(m);
  let gained = 0;
  m = m.map((r) => {
    const s = slideRow(r);
    gained += s.gained;
    return s.row;
  });
  for (let i = 0; i < (4 - times) % 4; i++) m = rotate(m);
  const moved = JSON.stringify(m) !== JSON.stringify(b);
  return { board: m, gained, moved };
}

const canMove = (b: Board) => (['left', 'right', 'up', 'down'] as const).some((d) => move(b, d).moved);

/** 2048 reskinned as a career ladder: merge Intern → Junior → … → Founder. */
export default function CareerLadder({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const [board, setBoard] = useState<Board>(() => addTile(addTile(empty())));
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const state = useRef({ board, score, over });
  state.current = { board, score, over };

  useEffect(() => {
    setBoard(addTile(addTile(empty())));
    setScore(0);
    setOver(false);
  }, [round]);

  const play = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down') => {
      const s = state.current;
      if (s.over) return;
      const r = move(s.board, dir);
      if (!r.moved) return;
      const next = addTile(r.board);
      const total = s.score + r.gained;
      setBoard(next);
      setScore(total);
      onScore(total);
      if (!canMove(next)) {
        setOver(true);
        onRoundEnd();
      }
    },
    [onScore, onRoundEnd]
  );

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };
      if (map[e.key]) {
        e.preventDefault();
        play(map[e.key]);
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, [play]);

  return (
    <div>
      <div
        ref={wrap}
        tabIndex={0}
        role="application"
        aria-label="Career ladder puzzle. Use arrow keys or swipe to merge matching titles."
        className="mx-auto grid w-full max-w-[300px] touch-none grid-cols-4 gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-2 outline-none focus:ring-2 focus:ring-[var(--accent)]"
        onPointerDown={(e) => { touch.current = { x: e.clientX, y: e.clientY }; wrap.current?.focus(); }}
        onPointerUp={(e) => {
          const t = touch.current;
          touch.current = null;
          if (!t) return;
          const dx = e.clientX - t.x, dy = e.clientY - t.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
          play(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
        }}
      >
        {board.flat().map((v, i) => (
          <div
            key={i}
            className="flex aspect-square items-center justify-center rounded-lg text-center text-[10px] font-bold leading-tight text-white transition-colors"
            style={{ background: v ? COLORS[v] ?? '#0f766e' : 'rgba(127,127,127,0.14)' }}
          >
            {v ? LABELS[v] ?? v : ''}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-[var(--fg-muted)]">
        {over ? `Ladder full — ${score} pts` : 'Swipe or use arrow keys. Merge matching titles to climb: Intern → … → Founder.'}
      </p>
    </div>
  );
}
