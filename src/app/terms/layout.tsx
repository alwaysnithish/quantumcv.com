import type { Metadata } from 'next';

// Gives /terms its own <title>, description and canonical.
// The root layout adds " — QuantumCV" to the end of the title.
export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms that apply when you use QuantumCV to build and analyse resumes.',
  alternates: { canonical: '/terms' },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
