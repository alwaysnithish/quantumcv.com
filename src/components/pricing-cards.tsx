'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Crown, Loader2 } from 'lucide-react';
import { useCurrency, formatPrice } from '@/lib/currency';
import { PLANS, PlanId } from '@/lib/plans';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingCards({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { currency, setCurrency } = useCurrency();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buyPlan(plan: PlanId) {
    setError(null);
    setLoadingPlan(plan);
    try {
      const meRes = await fetch('/api/auth/me');
      const me = await meRes.json();
      if (!me.user) {
        router.push('/login');
        return;
      }

      const checkoutRes = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, currency }),
      });
      const order = await checkoutRes.json();

      if (!order.success) {
        setError(order.message || 'Could not start checkout.');
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Could not load payment widget. Check your connection and try again.');
        return;
      }

      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'QuantumCV',
        description: `${PLANS[plan].credits} credits — ${PLANS[plan].resumeCount} resume generations`,
        theme: { color: '#1d9bf0' },
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...response, plan, currency }),
          });
          const verify = await verifyRes.json();
          if (verify.success) {
            router.push('/dashboard');
          } else {
            setError(verify.message || 'Payment verification failed.');
          }
        },
      });
      rzp.open();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-full border border-[var(--border)] p-1 bg-[var(--bg-subtle)]">
          {(['USD', 'INR'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                currency === c ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-muted)]'
              }`}
            >
              {c === 'USD' ? '$ USD' : '₹ INR'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto mb-6 text-sm text-red-500 bg-red-500/10 rounded-lg px-4 py-3 text-center">
          {error}
        </div>
      )}

      <div className={`grid sm:grid-cols-2 gap-6 ${compact ? 'max-w-2xl' : 'max-w-3xl'} mx-auto`}>
        {/* Starter */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-7 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={18} className="text-[var(--accent)]" strokeWidth={1.75} />
            <span className="font-bold text-sm uppercase tracking-wide text-[var(--fg-muted)]">Starter</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-extrabold">{formatPrice(currency, PLANS.starter.price[currency])}</span>
          </div>
          <p className="text-sm text-[var(--fg-muted)] mb-6">One-time purchase, credits never expire</p>
          <ul className="space-y-3 text-sm mb-7 flex-1">
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>{PLANS.starter.resumeCount} full AI resume generations</span></li>
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>{PLANS.starter.credits} total credits</span></li>
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>AI resume chat editing</span></li>
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>AI bullet-point enhancer</span></li>
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>All 30 templates + PDF export</span></li>
          </ul>
          <button
            onClick={() => buyPlan('starter')}
            disabled={loadingPlan === 'starter'}
            className="w-full rounded-full border border-[var(--border)] font-semibold py-2.5 text-sm hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingPlan === 'starter' && <Loader2 size={15} className="animate-spin" />}
            Get Starter
          </button>
        </div>

        {/* Pro */}
        <div className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--card)] p-7 flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-xs font-bold px-3 py-1 rounded-full">
            BEST VALUE
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Crown size={18} className="text-[var(--accent)]" strokeWidth={1.75} />
            <span className="font-bold text-sm uppercase tracking-wide text-[var(--fg-muted)]">Pro</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-4xl font-extrabold">{formatPrice(currency, PLANS.pro.price[currency])}</span>
          </div>
          <p className="text-sm text-[var(--fg-muted)] mb-6">One-time purchase, credits never expire</p>
          <ul className="space-y-3 text-sm mb-7 flex-1">
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>{PLANS.pro.resumeCount} full AI resume generations</span></li>
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>{PLANS.pro.credits} total credits</span></li>
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>AI resume chat editing</span></li>
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>AI bullet-point enhancer</span></li>
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>All 30 templates + PDF export</span></li>
            <li className="flex gap-2"><Check size={16} className="text-[var(--accent)] shrink-0 mt-0.5" /><span>Priority support</span></li>
          </ul>
          <button
            onClick={() => buyPlan('pro')}
            disabled={loadingPlan === 'pro'}
            className="w-full rounded-full bg-[var(--accent)] text-white font-semibold py-2.5 text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingPlan === 'pro' && <Loader2 size={15} className="animate-spin" />}
            Get Pro
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--fg-muted)] mt-6">
        5 credits per resume generation · 1 credit per AI chat edit or bullet enhance · both plans include 5 bonus editing credits
      </p>
    </div>
  );
}
