import type { Metadata } from 'next';

// Private page: gets its own tab title and is kept out of search results.
// The root layout adds " — QuantumCV" to the end of the title.
export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
