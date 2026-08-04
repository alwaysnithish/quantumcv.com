import Link from 'next/link';
import { Mail } from 'lucide-react';
import { XIcon, LinkedInIcon, InstagramIcon, YouTubeIcon } from './brand-icons';

const SOCIALS = [
  { Icon: XIcon, href: 'https://x.com/quantumcv', label: 'X (Twitter)' },
  { Icon: LinkedInIcon, href: 'https://linkedin.com/company/quantumcv', label: 'LinkedIn' },
  { Icon: InstagramIcon, href: 'https://instagram.com/quantumcv', label: 'Instagram' },
  { Icon: YouTubeIcon, href: 'https://youtube.com/@quantumcv', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="max-w-6xl mx-auto px-5 py-14 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white text-xs">Q</div>
            <span className="font-extrabold tracking-tight">QuantumCV</span>
          </div>
          <p className="text-sm text-[var(--fg-muted)] leading-relaxed">The AI Career Operating System — build resumes that get you hired.</p>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--fg-muted)] mb-3">Product</div>
          <div className="flex flex-col gap-2.5 text-sm">
            <a href="/#features" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Features</a>
            <Link href="/pricing" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Pricing</Link>
            <a href="/#how-it-works" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">How it works</a>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--fg-muted)] mb-3">Company</div>
          <div className="flex flex-col gap-2.5 text-sm">
            <Link href="/login" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Sign in</Link>
            <Link href="/contact" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Contact</Link>
            <Link href="/privacy" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">Terms of Service</Link>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--fg-muted)] mb-3">Connect</div>
          <a href="mailto:support@quantumcv.app" className="flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors mb-4">
            <Mail size={14} /> support@quantumcv.app
          </a>
          <div className="flex gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
              >
                <s.Icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border)] py-5 text-center text-xs text-[var(--fg-muted)]">
        © 2026 QuantumCV. All rights reserved.
      </div>
    </footer>
  );
}
