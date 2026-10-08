import type { Metadata } from 'next';

// Gives /contact its own <title>, description and canonical.
// The root layout adds " — QuantumCV" to the end of the title.
export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Questions about your resume, credits or account? Get in touch with the QuantumCV team at support@quantumcv.app.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
