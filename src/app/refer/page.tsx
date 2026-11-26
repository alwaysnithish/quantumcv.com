import type { Metadata } from 'next';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import ReferClient from './refer-client';
import { SITE_URL } from '@/lib/credit-config';

export const metadata: Metadata = {
  title: 'Refer & Earn — Give 10, Get 10 Free Credits',
  description: 'Invite friends to QuantumCV. When they finish their first free ATS scan, you both get +10 bonus credits. Refer 3 friends to unlock all premium templates.',
  alternates: { canonical: `${SITE_URL}/refer` },
};

export default function ReferPage() {
  return (
    <div className="min-h-screen text-[var(--fg)]">
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <ReferClient />
      </main>
      <Footer />
    </div>
  );
}
