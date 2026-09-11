'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Receipt,
  MessageSquareText,
  LayoutDashboard,
  Crown,
  Coins,
  FileText,
  Trash2,
  Send,
  Loader2,
} from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';

type Tab = 'overview' | 'users' | 'transactions' | 'support';

interface Overview {
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  totalPurchases: number;
  totalCreditsIssued: number;
  revenueByCurrency: { currency: string; total: number; count: number }[];
  openSupportTickets: number;
  totalResumes: number;
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  credits: number;
  premiumUnlocked: boolean;
  isStaff: boolean;
  dateJoined: string;
  lastLogin: string | null;
  totalCreditsPurchased: number;
  totalOrders: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  currency: string | null;
  amountPaid: number | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  status: string;
  createdAt: string;
  userEmail: string;
  userName: string;
}

interface ThreadSummary {
  id: number;
  subject: string;
  status: string;
  unreadByAdmin: boolean;
  lastMessageAt: string;
  userEmail: string;
  userName: string;
  userId: string;
  lastMessage: string;
}

interface ThreadMessage {
  id: number;
  sender: 'user' | 'admin';
  body: string;
  createdAt: string;
}

export default function AdminClient({ adminName }: { adminName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="border-b border-[var(--border)] sticky top-0 z-30 bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] shrink-0">
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="hidden sm:block h-4 w-px bg-[var(--border)]" />
            <span className="font-extrabold tracking-tight truncate">Admin — {adminName}</span>
          </div>
          <ThemeToggle />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {[
            { id: 'overview' as const, label: 'Overview', Icon: LayoutDashboard },
            { id: 'users' as const, label: 'Users', Icon: Users },
            { id: 'transactions' as const, label: 'Transactions', Icon: Receipt },
            { id: 'support' as const, label: 'Support', Icon: MessageSquareText },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2.5 border-b-2 whitespace-nowrap ${
                tab === t.id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-transparent text-[var(--fg-muted)]'
              }`}
            >
              <t.Icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'transactions' && <TransactionsTab />}
        {tab === 'support' && <SupportTab />}
      </main>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────

function OverviewTab() {
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-[var(--bg-subtle)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total users" value={data.totalUsers} />
        <StatCard icon={Crown} label="Premium users" value={data.premiumUsers} accent />
        <StatCard icon={Users} label="Free users" value={data.freeUsers} />
        <StatCard icon={FileText} label="Resumes created" value={data.totalResumes} />
        <StatCard icon={Receipt} label="Total orders" value={data.totalPurchases} />
        <StatCard icon={Coins} label="Credits issued" value={data.totalCreditsIssued} />
        <StatCard icon={MessageSquareText} label="Open tickets" value={data.openSupportTickets} accent={data.openSupportTickets > 0} />
      </div>

      <div>
        <h2 className="font-bold text-sm mb-3">Revenue by currency</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {data.revenueByCurrency.length === 0 ? (
            <div className="text-sm text-[var(--fg-muted)] border border-dashed border-[var(--border)] rounded-2xl p-6 text-center col-span-2">
              No purchases yet.
            </div>
          ) : (
            data.revenueByCurrency.map((r) => (
              <div key={r.currency} className="rounded-2xl border border-[var(--border)] p-5">
                <div className="text-xs text-[var(--fg-muted)] mb-1">{r.currency}</div>
                <div className="text-2xl font-extrabold">
                  {r.currency === 'INR' ? '₹' : '$'}
                  {r.total.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--fg-muted)] mt-1">{r.count} order{r.count === 1 ? '' : 's'}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] p-4">
      <Icon size={16} className={accent ? 'text-[var(--accent)] mb-2' : 'text-[var(--fg-muted)] mb-2'} />
      <div className="text-xl sm:text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-[var(--fg-muted)] mt-0.5">{label}</div>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/admin/users')
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !data) {
          throw new Error(data?.message || `Request failed (HTTP ${r.status})`);
        }
        return data;
      })
      .then((d) => setUsers(d.users || []))
      .catch((err) => setError(err.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete ${email}? This deletes their resumes, transactions, and support history permanently.`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) setUsers((u) => u.filter((x) => x.id !== id));
    else alert(data.message || 'Delete failed.');
  }

  if (loading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />)}</div>;

  if (error) {
    return (
      <div className="text-center py-12 border border-dashed border-red-300 rounded-2xl">
        <p className="text-sm text-red-500 mb-3">Couldn't load users: {error}</p>
        <button onClick={load} className="text-xs font-semibold rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--bg-subtle)]">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="bg-[var(--bg-subtle)] text-left text-xs text-[var(--fg-muted)] uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 font-semibold">User</th>
            <th className="px-4 py-3 font-semibold">Credits</th>
            <th className="px-4 py-3 font-semibold">Tier</th>
            <th className="px-4 py-3 font-semibold">Purchased</th>
            <th className="px-4 py-3 font-semibold">Orders</th>
            <th className="px-4 py-3 font-semibold">Joined</th>
            <th className="px-4 py-3 font-semibold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{u.fullName || '—'}</div>
                <div className="text-xs text-[var(--fg-muted)]">{u.email}</div>
              </td>
              <td className="px-4 py-3 font-semibold">{u.credits}</td>
              <td className="px-4 py-3">
                {u.premiumUnlocked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                    <Crown size={12} /> Premium
                  </span>
                ) : (
                  <span className="text-xs text-[var(--fg-muted)]">Free</span>
                )}
              </td>
              <td className="px-4 py-3">{u.totalCreditsPurchased}</td>
              <td className="px-4 py-3">{u.totalOrders}</td>
              <td className="px-4 py-3 text-xs text-[var(--fg-muted)]">{new Date(u.dateJoined).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right">
                {!u.isStaff && (
                  <button onClick={() => deleteUser(u.id, u.email)} className="text-[var(--fg-muted)] hover:text-red-500" title="Delete user">
                    <Trash2 size={15} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Transactions ──────────────────────────────────────

function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/transactions')
      .then((r) => r.json())
      .then((d) => setTransactions(d.transactions || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />)}</div>;

  return (
    <div className="border border-[var(--border)] rounded-2xl overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead className="bg-[var(--bg-subtle)] text-left text-xs text-[var(--fg-muted)] uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 font-semibold">User</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Credits</th>
            <th className="px-4 py-3 font-semibold">Paid</th>
            <th className="px-4 py-3 font-semibold">Order ID</th>
            <th className="px-4 py-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {transactions.map((t) => (
            <tr key={t.id}>
              <td className="px-4 py-3">
                <div className="font-medium">{t.userName || '—'}</div>
                <div className="text-xs text-[var(--fg-muted)]">{t.userEmail}</div>
              </td>
              <td className="px-4 py-3 text-xs capitalize">{t.type.replace('_', ' ')}</td>
              <td className={`px-4 py-3 font-semibold ${t.amount > 0 ? 'text-green-500' : 'text-[var(--fg-muted)]'}`}>
                {t.amount > 0 ? '+' : ''}
                {t.amount}
              </td>
              <td className="px-4 py-3">
                {t.amountPaid != null && t.currency ? `${t.currency === 'INR' ? '₹' : '$'}${(t.amountPaid / 100).toFixed(2)}` : '—'}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[var(--fg-muted)]">{t.razorpayOrderId || '—'}</td>
              <td className="px-4 py-3 text-xs text-[var(--fg-muted)]">{new Date(t.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-[var(--fg-muted)]">No transactions yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Support ───────────────────────────────────────────

function SupportTab() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<ThreadSummary | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);

  const loadThreads = useCallback(() => {
    fetch('/api/admin/support')
      .then((r) => r.json())
      .then((d) => setThreads(d.threads || []))
      .finally(() => setLoadingThreads(false));
  }, []);

  useEffect(() => loadThreads(), [loadThreads]);

  async function openThread(id: number) {
    setSelectedId(id);
    const res = await fetch(`/api/admin/support/${id}`);
    const data = await res.json();
    setSelectedThread(data.thread);
    setMessages(data.messages || []);
    setThreads((ts) => ts.map((t) => (t.id === id ? { ...t, unreadByAdmin: false } : t)));
  }

  async function sendReply() {
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((m) => [...m, { id: Date.now(), sender: 'admin', body: reply, createdAt: new Date().toISOString() }]);
        setReply('');
        loadThreads();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[600px]">
      <div className="border border-[var(--border)] rounded-2xl overflow-y-auto">
        {loadingThreads ? (
          <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-[var(--bg-subtle)] animate-pulse" />)}</div>
        ) : threads.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--fg-muted)]">No support messages yet.</div>
        ) : (
          threads.map((t) => (
            <button
              key={t.id}
              onClick={() => openThread(t.id)}
              className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-subtle)] ${selectedId === t.id ? 'bg-[var(--bg-subtle)]' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${t.unreadByAdmin ? 'font-bold' : 'font-medium'}`}>{t.userName || t.userEmail}</span>
                {t.unreadByAdmin && <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />}
              </div>
              <div className="text-xs text-[var(--fg-muted)] truncate mt-0.5">{t.lastMessage}</div>
              <div className="text-[10px] text-[var(--fg-muted)] mt-1">{new Date(t.lastMessageAt).toLocaleString()}</div>
            </button>
          ))
        )}
      </div>

      <div className="border border-[var(--border)] rounded-2xl flex flex-col">
        {!selectedThread ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--fg-muted)]">Select a conversation</div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <div className="font-semibold text-sm">{selectedThread.userName || selectedThread.userEmail}</div>
              <div className="text-xs text-[var(--fg-muted)]">{selectedThread.userEmail}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.sender === 'admin' ? 'bg-[var(--accent)] text-white ml-auto rounded-br-sm' : 'bg-[var(--bg-subtle)] rounded-bl-sm'
                  }`}
                >
                  {m.sender === 'admin' && <div className="text-[10px] opacity-70 mb-0.5 font-semibold">Team QuantumCV</div>}
                  {m.body}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-[var(--border)] flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                placeholder="Reply as Team QuantumCV…"
                className="flex-1 rounded-full border border-[var(--border)] bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-50 shrink-0"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
