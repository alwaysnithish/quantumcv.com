import type { Metadata } from 'next';

// Gives /privacy its own <title>, description and canonical.
// The root layout adds " — QuantumCV" to the end of the title.
export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How QuantumCV collects, uses and protects your personal data and resume content.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
