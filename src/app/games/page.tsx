import type { Metadata } from 'next';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import Arcade from '@/components/loading-games/arcade';

export const metadata: Metadata = {
  title: 'Free Career Mini-Games — QuantumCV Arcade',
  description: 'Play ATS Keyword Catcher, Career Ladder 2048 and Tech & HR Trivia any time. Free, no signup.',
};

export default function GamesPage() {
  return (
    <div className="min-h-screen text-[var(--fg)]">
      <Nav />
      <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">QuantumCV Arcade</h1>
        <p className="mt-3 mb-8 text-[var(--fg-muted)]">The same mini-games you see while your resume loads — open 24/7, no waiting required.</p>
        <Arcade />
      </main>
      <Footer />
    </div>
  );
}
