import type { Metadata } from 'next';

// Gives /login its own <title>, description and canonical.
// The root layout adds " — QuantumCV" to the end of the title.
export const metadata: Metadata = {
  title: 'Log In or Sign Up',
  description:
    'Log in or create a free QuantumCV account to build an ATS-ready resume, edit it by chat, and analyse your resume.',
  alternates: { canonical: '/login' },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
