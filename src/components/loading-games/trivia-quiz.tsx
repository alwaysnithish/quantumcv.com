'use client';

import { useEffect, useMemo, useState } from 'react';

interface Q { q: string; options: string[]; answer: number; why: string }

const BANK: Q[] = [
  { q: 'What does ATS stand for in hiring?', options: ['Applicant Tracking System', 'Automated Talent Search', 'Application Time Sheet', 'Advanced Test Suite'], answer: 0, why: 'ATS software stores and filters job applications.' },
  { q: 'Which resume file type is safest for most ATS?', options: ['Text-based PDF or DOCX', 'JPEG screenshot', 'PNG export', 'Scanned image PDF'], answer: 0, why: 'ATS needs real, selectable text.' },
  { q: 'What does the “A” in STAR bullets stand for?', options: ['Action', 'Achievement', 'Analysis', 'Approval'], answer: 0, why: 'Situation, Task, Action, Result.' },
  { q: 'Best length for a fresher resume?', options: ['One page', 'Three pages', 'Five pages', 'Half a page'], answer: 0, why: 'Recruiters skim; one page keeps the signal high.' },
  { q: 'Which verb is strongest to open a bullet?', options: ['Implemented', 'Responsible for', 'Worked on', 'Helped with'], answer: 0, why: 'Specific action verbs show ownership.' },
  { q: 'HTTP status 404 means…', options: ['Not found', 'Server error', 'Unauthorized', 'Redirect'], answer: 0, why: 'The resource was not found.' },
  { q: 'In Git, which command saves a snapshot of staged changes?', options: ['git commit', 'git fetch', 'git clone', 'git stash pop'], answer: 0, why: 'git commit records the staged snapshot.' },
  { q: 'Which is a SQL aggregate function?', options: ['COUNT()', 'JOIN()', 'WHERE()', 'FROM()'], answer: 0, why: 'COUNT, SUM, AVG, MIN and MAX aggregate rows.' },
  { q: 'What should you do with keywords from a job description?', options: ['Use the ones that are true for you', 'Copy every one', 'Hide them in white text', 'Ignore them'], answer: 0, why: 'Honest keyword matching beats stuffing.' },
  { q: 'Big-O of binary search?', options: ['O(log n)', 'O(n)', 'O(n²)', 'O(1)'], answer: 0, why: 'It halves the search space each step.' },
  { q: 'In an interview, “tell me about yourself” is best answered with…', options: ['A 60-second relevant pitch', 'Your life story', 'One word', 'Your salary demand'], answer: 0, why: 'Keep it short, role-relevant and specific.' },
  { q: 'Which belongs on a resume?', options: ['Quantified results you can verify', 'Fake metrics', 'Your date of birth photo collage', 'Passwords'], answer: 0, why: 'Only claims you can defend in an interview.' },
  { q: 'What does CSS “flexbox” help with?', options: ['Layout and alignment', 'Database queries', 'Encryption', 'Image compression'], answer: 0, why: 'Flexbox is a one-dimensional layout system.' },
  { q: 'Which section do recruiters read first?', options: ['Top third: name, headline, recent role', 'The last line', 'References', 'Hobbies'], answer: 0, why: 'Recruiters skim the top of page one first.' },
];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const ROUND_LEN = 5;

/** Tech / HR trivia — 5 questions per round, streak bonus. */
export default function TriviaQuiz({ onScore, onRoundEnd, round }: { onScore: (n: number) => void; onRoundEnd: () => void; round: number }) {
  const questions = useMemo(
    () => shuffle(BANK).slice(0, ROUND_LEN).map((q) => {
      const correct = q.options[q.answer];
      const options = shuffle(q.options);
      return { ...q, options, answer: options.indexOf(correct) };
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round]
  );
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => { setI(0); setPicked(null); setScore(0); setStreak(0); }, [round]);

  const q = questions[i];
  const done = i >= ROUND_LEN;

  function choose(idx: number) {
    if (picked !== null || !q) return;
    setPicked(idx);
    const ok = idx === q.answer;
    const nextStreak = ok ? streak + 1 : 0;
    const total = score + (ok ? 10 + (nextStreak - 1) * 5 : 0);
    setStreak(nextStreak);
    setScore(total);
    onScore(total);
    setTimeout(() => {
      setPicked(null);
      setI((n) => {
        if (n + 1 >= ROUND_LEN) onRoundEnd();
        return n + 1;
      });
    }, 1100);
  }

  if (done) return <p className="py-10 text-center text-sm font-semibold">Quiz complete — {score} pts 🎉</p>;

  return (
    <div className="mx-auto max-w-[400px]">
      <div className="mb-2 flex justify-between text-[11px] text-[var(--fg-muted)]">
        <span>Question {i + 1}/{ROUND_LEN}</span>
        <span>🔥 Streak {streak}</span>
      </div>
      <p className="mb-3 text-sm font-bold">{q.q}</p>
      <div className="grid gap-2">
        {q.options.map((o, idx) => {
          const state = picked === null ? '' : idx === q.answer ? 'border-emerald-500 bg-emerald-500/15' : idx === picked ? 'border-red-500 bg-red-500/15' : 'opacity-50';
          return (
            <button key={o} onClick={() => choose(idx)} disabled={picked !== null} className={`rounded-lg border border-[var(--border)] px-3 py-2 text-left text-sm font-medium hover:bg-[var(--bg-subtle)] ${state}`}>
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && <p className="mt-2 text-[11px] text-[var(--fg-muted)]">{q.why}</p>}
    </div>
  );
}
