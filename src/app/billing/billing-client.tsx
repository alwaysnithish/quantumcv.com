'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Coins,
  Sparkles,
  MessageSquareText,
  Wand2,
  Gift,
  CreditCard,
  Crown,
} from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';

interface Transaction {
  id: number;
  type: 'purchase' | 'generate' | 'chat_edit' | 'enhance_bullet' | 'bonus';
  amount: number;
  status: string;
  createdAt: string;
}

const TYPE_META: Record<Transaction['type'], { label: string; Icon: any; color: string }> = {
  purchase: { label: 'Credit pack purchase', Icon: CreditCard, color: 'text-green-500' },
  generate: { label: 'AI resume generation', Icon: Sparkles, color: 'text-[var(--accent)]' },
  chat_edit: { label: 'AI resume chat edit', Icon: MessageSquareText, color: 'text-[var(--accent)]' },
  enhance_bullet: { label: 'AI bullet/skill enhance', Icon: Wand2, color: 'text-[var(--accent)]' },
  bonus: { label: 'Welcome bonus', Icon: Gift, color: 'text-amber-500' },
};

export default function BillingClient({ credits, premiumUnlocked }: { credits: number; premiumUnlocked: boolean }) {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing/history')
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions || []))
      .finally(() => setLoading(false));
  }, []);

  const totalPurchased = transactions.filter((t) => t.type === 'purchase').reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="border-b border-[var(--border)] sticky top-0 z-30 bg-[var(--bg)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
            <ArrowLeft size={15} /> Dashboard
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-xl sm:text-2xl font-extrabold mb-1">Billing & credit history</h1>
        <p className="text-sm text-[var(--fg-muted)] mb-8">Every credit purchase and every credit spent, in one place.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <div className="rounded-2xl border border-[var(--border)] p-4">
            <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] mb-1">
              <Coins size={13} className="text-[var(--accent)]" /> Current balance
            </div>
            <div className="text-2xl font-extrabold">{credits}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] p-4">
            <div className="text-xs text-[var(--fg-muted)] mb-1">Total purchased</div>
            <div className="text-2xl font-extrabold">{totalPurchased}</div>
          </div>
          <div className="rounded-2xl border border-[var(--border)] p-4 col-span-2 sm:col-span-1">
            <div className="text-xs text-[var(--fg-muted)] mb-1">Total spent</div>
            <div className="text-2xl font-extrabold">{totalSpent}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] p-4 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Crown size={18} className={premiumUnlocked ? 'text-[var(--accent)]' : 'text-[var(--fg-muted)]'} />
            <div>
              <div className="text-sm font-semibold">{premiumUnlocked ? 'Premium templates unlocked' : 'Free tier — 7 basic templates'}</div>
              <div className="text-xs text-[var(--fg-muted)]">{premiumUnlocked ? 'All 30 templates available' : 'Buy any credit pack to unlock all 30'}</div>
            </div>
          </div>
          {!premiumUnlocked && (
            <Link href="/pricing" className="text-xs font-semibold rounded-full bg-[var(--accent)] text-white px-3.5 py-2 hover:bg-[var(--accent-hover)] shrink-0">
              Upgrade
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">Transaction history</h2>
          <Link href="/pricing" className="text-xs font-semibold text-[var(--accent)] hover:underline">
            Buy more credits
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl text-sm text-[var(--fg-muted)]">
            No transactions yet.
          </div>
        ) : (
          <div className="border border-[var(--border)] rounded-2xl divide-y divide-[var(--border)] overflow-hidden">
            {transactions.map((t) => {
              const meta = TYPE_META[t.type];
              const Icon = meta.Icon;
              return (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center shrink-0">
                      <Icon size={14} className={meta.color} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{meta.label}</div>
                      <div className="text-xs text-[var(--fg-muted)]">{new Date(t.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold shrink-0 ${t.amount > 0 ? 'text-green-500' : 'text-[var(--fg-muted)]'}`}>
                    {t.amount > 0 ? '+' : ''}
                    {t.amount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
