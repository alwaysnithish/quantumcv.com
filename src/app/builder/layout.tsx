import type { Metadata } from 'next';

// Private page: gets its own tab title and is kept out of search results.
// The root layout adds " — QuantumCV" to the end of the title.
export const metadata: Metadata = {
  title: 'Resume Builder',
  robots: { index: false, follow: false },
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
