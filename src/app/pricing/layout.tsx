import type { Metadata } from 'next';

// Gives /pricing its own <title>, description and canonical.
// The root layout adds " — QuantumCV" to the end of the title.
export const metadata: Metadata = {
  title: 'AI Resume Builder Pricing, No Subscription',
  description:
    'Simple credit packs for the QuantumCV AI resume builder. One-time purchases, no subscription, and credits that do not expire. Start with free credits.',
  alternates: { canonical: '/pricing' },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
