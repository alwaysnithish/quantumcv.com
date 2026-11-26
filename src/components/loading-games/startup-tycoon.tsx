'use client';

import { useEffect, useRef, useState } from 'react';

const UPGRADES = [
  { id: 'intern', name: 'Hire an Intern', emoji: '🧑‍🎓', base: 15, cps: 0.6 },
  { id: 'bot', name: 'Recruiter Bot', emoji: '🤖', base: 110, cps: 4 },
  { id: 'network', name: 'Referral Network', emoji: '🤝', base: 650, cps: 20 },
  { id: 'studio', name: 'AI Resume Studio', emoji: '✨', base: 4000, cps: 120 },
  { id: 'unicorn', name: 'Unicorn Funding', emoji: '🦄', base: 30000, cps: 700 },
];
const TIME = 90;
const fmt = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1)}k` : Math.floor(n).toLocaleString());

/** Startup Tycoon — idle simulation. Tap to land interviews, buy upgrades, beat the 90-second quarter. */
export default function StartupTycoon({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const [cash, setCash] = useState(0);
  const [earned, setEarned] = useState(0);
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [click, setClick] = useState(1);
  const [clickLvl, setClickLvl] = useState(0);
  const [left, setLeft] = useState(TIME);
  const [pops, setPops] = useState<{ id: number; x: number; v: number }[]>([]);
  const done = useRef(false);
  const popId = useRef(0);
  const cps = UPGRADES.reduce((s, u) => s + (owned[u.id] ?? 0) * u.cps, 0);
  const st = useRef({ cps, earned });
  st.current = { cps, earned };

  useEffect(() => { setCash(0); setEarned(0); setOwned({}); setClick(1); setClickLvl(0); setLeft(TIME); done.current = false; }, [round]);

  useEffect(() => {
    const t = setInterval(() => {
      if (done.current) return;
      const gain = st.current.cps / 10;
      if (gain > 0) { setCash((c) => c + gain); setEarned((e) => { const n = e + gain; onScore(Math.floor(n)); return n; }); }
    }, 100);
    const timer = setInterval(() => {
      setLeft((l) => {
        if (l <= 1 && !done.current) { done.current = true; onRoundEnd(); return 0; }
        return Math.max(0, l - 1);
      });
    }, 1000);
    return () => { clearInterval(t); clearInterval(timer); };
  }, [round, onScore, onRoundEnd]);

  const cost = (u: (typeof UPGRADES)[number]) => Math.ceil(u.base * Math.pow(1.17, owned[u.id] ?? 0));
  const clickCost = Math.ceil(25 * Math.pow(1.7, clickLvl));

  function tap(e: React.PointerEvent) {
    if (done.current) return;
    setCash((c) => c + click);
    setEarned((en) => { const n = en + click; onScore(Math.floor(n)); return n; });
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = ++popId.current;
    setPops((p) => [...p.slice(-6), { id, x: e.clientX - r.left, v: click }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 700);
  }

  return (
    <div className="mx-auto max-w-[340px] select-none">
      <div className="mb-2 flex justify-between text-xs">
        <span className="font-bold">💰 {fmt(cash)}</span>
        <span className="text-[var(--fg-muted)]">{fmt(cps)}/s</span>
        <span className={left <= 10 ? 'font-bold text-red-500' : 'text-[var(--fg-muted)]'}>⏱ {left}s</span>
      </div>
      <button onPointerDown={tap} disabled={left === 0} className="relative h-24 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent)] to-violet-500 text-lg font-extrabold text-white shadow-lg active:scale-[0.98] disabled:opacity-60">
        📨 Land an interview (+{click})
        {pops.map((p) => (<span key={p.id} className="pointer-events-none absolute top-2 animate-bounce text-sm" style={{ left: p.x, opacity: 0.9 }}>+{p.v}</span>))}
      </button>
      <div className="mt-3 grid gap-2">
        <button onClick={() => { if (cash >= clickCost && !done.current) { setCash(cash - clickCost); setClick(click + 1); setClickLvl(clickLvl + 1); } }} disabled={cash < clickCost || left === 0} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-left text-xs hover:bg-[var(--bg-subtle)] disabled:opacity-45">
          <span>📄 <b>Better Resume</b> <span className="text-[var(--fg-muted)]">+1 per tap</span></span><b>💰 {fmt(clickCost)}</b>
        </button>
        {UPGRADES.map((u) => {
          const c = cost(u);
          return (
            <button key={u.id} onClick={() => { if (cash >= c && !done.current) { setCash(cash - c); setOwned({ ...owned, [u.id]: (owned[u.id] ?? 0) + 1 }); } }} disabled={cash < c || left === 0} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-left text-xs hover:bg-[var(--bg-subtle)] disabled:opacity-45">
              <span>{u.emoji} <b>{u.name}</b> <span className="text-[var(--fg-muted)]">×{owned[u.id] ?? 0} · +{u.cps}/s</span></span><b>💰 {fmt(c)}</b>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] text-[var(--fg-muted)]">{left === 0 ? `Quarter closed — you earned ${fmt(earned)}!` : 'Score = total money earned in 90 seconds.'}</p>
    </div>
  );
}
