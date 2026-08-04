'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import ThemeToggle from './theme-toggle';

export default function Nav() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.user))
      .catch(() => setLoggedIn(false));
  }, []);

  const links = [
    { href: '/#features', label: 'Features' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/#how-it-works', label: 'How it works' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg)]/80 border-b border-[var(--border)]">
      <nav className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white text-sm">Q</div>
          <span className="font-extrabold tracking-tight text-[var(--fg)]">QuantumCV</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {loggedIn === null ? (
            <div className="w-24 h-9 rounded-full bg-[var(--bg-subtle)] animate-pulse" />
          ) : loggedIn ? (
            <Link href="/dashboard" className="rounded-full bg-[var(--accent)] text-white text-sm font-semibold px-4 py-2 hover:bg-[var(--accent-hover)] transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-[var(--fg)] px-3 py-2 hover:text-[var(--accent)] transition-colors">
                Log in
              </Link>
              <Link href="/login" className="rounded-full bg-[var(--accent)] text-white text-sm font-semibold px-4 py-2 hover:bg-[var(--accent-hover)] transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden text-[var(--fg)]" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] px-5 py-4 flex flex-col gap-4 bg-[var(--bg)]">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-[var(--fg-muted)]" onClick={() => setMobileOpen(false)}>
              {l.label}
            </a>
          ))}
          <div className="flex items-center justify-between pt-2">
            <ThemeToggle />
            <Link href={loggedIn ? '/dashboard' : '/login'} className="rounded-full bg-[var(--accent)] text-white text-sm font-semibold px-4 py-2">
              {loggedIn ? 'Dashboard' : 'Get Started'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
