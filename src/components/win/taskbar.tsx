'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanSearch, FileText, LayoutTemplate, Wand2, Gift, Tag } from 'lucide-react';

const ITEMS = [
  { href: '/resumeanalyser', label: 'ATS Scanner', short: 'ATS', Icon: ScanSearch },
  { href: '/builder', label: 'Resume Builder', short: 'Builder', Icon: FileText },
  { href: '/#templates', label: '30+ Templates', short: 'Templates', Icon: LayoutTemplate },
  { href: '/tools', label: 'Free AI Tools', short: 'AI Tools', Icon: Wand2 },
  { href: '/refer', label: 'Refer & Earn', short: 'Refer', Icon: Gift },
  { href: '/pricing', label: 'Pricing', short: 'Pricing', Icon: Tag },
] as const;

// Full-screen workspaces keep their own chrome; the taskbar would cover it.
const HIDDEN_ON = ['/builder', '/admin', '/login'];

export default function Taskbar() {
  const pathname = usePathname() ?? '/';
  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    document.body.classList.toggle('has-taskbar', !hidden);
    return () => document.body.classList.remove('has-taskbar');
  }, [hidden]);

  if (hidden) return null;

  return (
    <nav className="win-taskbar" aria-label="Quick launch">
      {ITEMS.map(({ href, label, short, Icon }) => {
        const active = href.startsWith('/#') ? false : pathname === href || pathname.startsWith(href + '/');
        return (
          <Link key={href} href={href} className="win-task" aria-current={active ? 'page' : undefined} title={label}>
            <Icon size={18} strokeWidth={1.75} className="shrink-0 text-[var(--accent)]" />
            <span className="label hidden md:inline">{label}</span>
            <span className="label md:hidden">{short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
