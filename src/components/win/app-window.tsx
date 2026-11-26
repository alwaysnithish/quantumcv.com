'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Minus, Square, Copy, X } from 'lucide-react';

/**
 * Windows 11 style app window: 12px radius acrylic frame, title bar with
 * working minimize / maximize / close controls. Used to frame the tools on
 * the homepage, tool pages and the referral hub.
 */
export default function AppWindow({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!maximized) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMaximized(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [maximized]);

  if (closed) {
    return (
      <button
        onClick={() => setClosed(false)}
        className="glass inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--fg)]"
      >
        {icon}
        Reopen “{title}”
      </button>
    );
  }

  return (
    <>
      {maximized && <div className="fixed inset-0 z-[79] bg-black/40" onClick={() => setMaximized(false)} />}
      <div className={`win-window ${maximized ? 'is-maximized' : ''} ${className}`} role="group" aria-label={title}>
        <div className="win-titlebar">
          <span className="flex items-center gap-2 text-xs font-semibold text-[var(--fg)] min-w-0">
            {icon}
            <span className="truncate">{title}</span>
          </span>
          <span className="flex-1" />
          <button className="win-ctl" onClick={() => setMinimized((v) => !v)} aria-label={minimized ? 'Restore' : 'Minimize'}>
            <Minus size={14} />
          </button>
          <button className="win-ctl" onClick={() => setMaximized((v) => !v)} aria-label={maximized ? 'Restore down' : 'Maximize'}>
            {maximized ? <Copy size={12} /> : <Square size={12} />}
          </button>
          <button className="win-ctl close" onClick={() => setClosed(true)} aria-label="Close">
            <X size={15} />
          </button>
        </div>
        {!minimized && <div>{children}</div>}
      </div>
    </>
  );
}
