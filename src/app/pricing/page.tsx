import Nav from '@/components/nav';
import Footer from '@/components/footer';
import PricingCards from '@/components/pricing-cards';
import ScrollReveal from '@/components/scroll-reveal';
import { CreditBreakdown, CreditCalculator } from '@/components/credit-breakdown';
import { CREDIT_COSTS, SIGNUP_BONUS_CREDITS, REFERRAL_REWARD_CREDITS } from '@/lib/credit-config';

const FAQS = [
  {
    q: 'Do credits expire?',
    a: 'No. Once purchased, your credits stay on your account until you use them — no monthly subscription, no expiry.',
  },
  {
    q: 'What costs credits?',
    a: `Generating a resume with AI costs ${CREDIT_COSTS.generate} credits. Each AI chat edit (e.g. "add a skills section") or AI bullet-point enhance costs ${CREDIT_COSTS.chat_edit} credit. Everything else — ATS score checks, manual editing, PDF and Word export, importing a resume, version history — is free and unlimited.`,
  },
  {
    q: 'How many credits do I get for free?',
    a: `Every new account gets ${SIGNUP_BONUS_CREDITS} free credits — enough for ${Math.floor(SIGNUP_BONUS_CREDITS / CREDIT_COSTS.generate)} full AI resumes or ${SIGNUP_BONUS_CREDITS} AI edits. Refer a friend and you both get +${REFERRAL_REWARD_CREDITS} more when they finish their first ATS scan.`,
  },
  {
    q: 'What happens if I run out mid-edit?',
    a: "You'll see a clear message telling you how many more credits you need — just top up and continue exactly where you left off.",
  },
  {
    q: 'Can I get a refund?',
    a: 'Since credits are consumed only when you actually use an AI action, unused credit packs can be refunded — reach out at hello@quantumcv.app.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />

      <section className="max-w-4xl mx-auto px-5 pt-16 pb-6 text-center">
        <ScrollReveal>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">Simple, pay-as-you-go pricing</h1>
          <p className="text-[var(--fg-muted)] max-w-lg mx-auto">No subscriptions, no auto-renewal. Buy a credit pack once, use it whenever you need it.</p>
        </ScrollReveal>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-6">
        <ScrollReveal>
          <CreditBreakdown />
        </ScrollReveal>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-12">
        <ScrollReveal>
          <PricingCards />
        </ScrollReveal>
      </section>

      <section className="max-w-6xl mx-auto px-5 pb-6">
        <ScrollReveal>
          <CreditCalculator />
        </ScrollReveal>
      </section>

      <section className="max-w-2xl mx-auto px-5 py-16">
        <ScrollReveal>
          <h2 className="text-2xl font-extrabold mb-8 text-center">Frequently asked questions</h2>
        </ScrollReveal>
        <div className="space-y-6">
          {FAQS.map((f, i) => (
            <ScrollReveal key={f.q} delay={i * 0.08}>
              <div className="border-b border-[var(--border)] pb-6">
                <h3 className="font-bold mb-2">{f.q}</h3>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{f.a}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
