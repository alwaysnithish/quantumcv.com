import Nav from '@/components/nav';
import Footer from '@/components/footer';
import ScrollReveal from '@/components/scroll-reveal';
import { Mail } from 'lucide-react';
import { XIcon, LinkedInIcon, InstagramIcon, YouTubeIcon } from '@/components/brand-icons';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the QuantumCV team.',
};

const SOCIALS = [
  { Icon: XIcon, href: 'https://x.com/quantumcv', label: 'X (Twitter)', handle: '@quantumcv' },
  { Icon: LinkedInIcon, href: 'https://linkedin.com/company/quantumcv', label: 'LinkedIn', handle: 'company/quantumcv' },
  { Icon: InstagramIcon, href: 'https://instagram.com/quantumcv', label: 'Instagram', handle: '@quantumcv' },
  { Icon: YouTubeIcon, href: 'https://youtube.com/@quantumcv', label: 'YouTube', handle: '@quantumcv' },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      <main className="max-w-2xl mx-auto px-5 py-16 sm:py-20 text-center">
        <ScrollReveal>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Get in touch</h1>
          <p className="text-[var(--fg-muted)] mb-12">Questions, feedback, or need help with your account? We'd love to hear from you.</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <a
            href="mailto:support@quantumcv.app"
            className="inline-flex items-center gap-2.5 rounded-full bg-[var(--accent)] text-white font-semibold px-6 py-3 text-sm hover:bg-[var(--accent-hover)] transition-colors mb-14"
          >
            <Mail size={16} /> support@quantumcv.app
          </a>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="text-xs font-bold uppercase tracking-wide text-[var(--fg-muted)] mb-5">Follow us</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--border)] p-5 hover:border-[var(--accent)]/40 transition-colors"
              >
                <s.Icon size={22} />
                <span className="text-xs font-semibold">{s.label}</span>
                <span className="text-[11px] text-[var(--fg-muted)]">{s.handle}</span>
              </a>
            ))}
          </div>
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
}
