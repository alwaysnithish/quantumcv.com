'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
  id: number;
  sender: 'user' | 'admin';
  body: string;
  createdAt: string;
}

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadThread() {
    const res = await fetch('/api/support/thread');
    const data = await res.json();
    setMessages(data.messages || []);
    setLoaded(true);
  }

  useEffect(() => {
    // Light polling for admin replies while the app is open — good enough
    // for a support widget without needing a websocket.
    loadThread();
    const interval = setInterval(loadThread, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input;
    setInput('');
    setMessages((m) => [...m, { id: Date.now(), sender: 'user', body: text, createdAt: new Date().toISOString() }]);
    try {
      await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-[var(--accent)] text-white shadow-lg flex items-center justify-center z-40 hover:bg-[var(--accent-hover)] transition-colors"
        style={{ opacity: open ? 0 : 1, pointerEvents: open ? 'none' : 'auto' }}
        aria-label="Support chat"
      >
        <MessageCircle size={20} />
      </button>

      <div
        className="fixed bottom-5 right-5 w-[340px] max-h-[480px] bg-[var(--bg)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col z-40 transition-all"
        style={{ transform: open ? 'translateY(0)' : 'translateY(20px)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <span className="text-sm font-bold">Support — Team QuantumCV</span>
          <button onClick={() => setOpen(false)} className="text-[var(--fg-muted)] hover:text-[var(--fg)]">
            <X size={16} />
          </button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-[220px]">
          {!loaded ? (
            <div className="text-xs text-[var(--fg-muted)] text-center py-6">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="text-xs text-[var(--fg-muted)] text-center py-6">
              Have a question or ran into an issue? Send us a message — we usually reply by email too.
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`px-3 py-2 rounded-2xl text-[13px] leading-relaxed max-w-[85%] ${
                  m.sender === 'user' ? 'bg-[var(--accent)] text-white self-end rounded-br-sm' : 'bg-[var(--bg-subtle)] self-start rounded-bl-sm'
                }`}
              >
                {m.sender === 'admin' && <div className="text-[10px] opacity-70 mb-0.5 font-semibold">Team QuantumCV</div>}
                {m.body}
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 p-2.5 border-t border-[var(--border)]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Message Team QuantumCV…"
            className="flex-1 rounded-full border border-[var(--border)] bg-transparent px-3.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-50 shrink-0"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </>
  );
}
