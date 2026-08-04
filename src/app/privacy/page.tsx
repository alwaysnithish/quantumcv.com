import Nav from '@/components/nav';
import Footer from '@/components/footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'QuantumCV Privacy Policy.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      <main className="max-w-3xl mx-auto px-5 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-sm text-[var(--fg-muted)] mb-10">Last updated: July 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--fg-muted)]">
          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">1. Information we collect</h2>
            <p>When you use QuantumCV, we collect:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Account information: your email address and name (via email sign-in or Google sign-in)</li>
              <li>Resume content: career data, work history, education, skills, and other information you submit to generate or edit resumes</li>
              <li>Usage data: credit balance, transaction history, and basic activity logs (e.g. resumes created, AI actions used)</li>
              <li>Payment information: processed directly by our payment provider (Razorpay) — QuantumCV does not store your card or payment details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">2. How we use your information</h2>
            <p>We use your information to: provide and improve the Service, generate resume content via our AI provider (Google Gemini), send verification codes and account-related emails, process credit pack purchases, and provide customer support.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">3. AI processing</h2>
            <p>Resume generation and editing features send your submitted career data and resume content to Google's Gemini API for processing. This data is used to generate resume content and is subject to Google's own data handling practices for API usage. We do not sell your resume content to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">4. Data storage</h2>
            <p>Your account and resume data are stored in a Postgres database (hosted by Neon). Resumes are retained until you delete them or delete your account. Version history is kept so you can restore earlier versions of a resume.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">5. Payment processing</h2>
            <p>Credit pack purchases are processed by Razorpay. We store a record of the transaction (amount, credits granted, order/payment IDs) for accounting and support purposes, but we do not store your card number or other sensitive payment details — these are handled entirely by Razorpay.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">6. Data sharing</h2>
            <p>We do not sell your personal information. We share data only with the service providers needed to operate QuantumCV: our AI provider (Google Gemini) for resume generation, our payment processor (Razorpay) for purchases, our email provider for account verification, and our hosting/database providers (Vercel, Neon).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">7. Cookies and sessions</h2>
            <p>We use a signed session cookie to keep you logged in. We do not use third-party advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">8. Your rights</h2>
            <p>You can request a copy of your data, request deletion of your account and associated data, or ask questions about how your data is used, by contacting <a href="mailto:support@quantumcv.app" className="text-[var(--accent)] hover:underline">support@quantumcv.app</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">9. Data retention</h2>
            <p>We retain your data for as long as your account is active. If you request account deletion, we will delete your personal data and resume content, except where retention is required for legal or accounting purposes (e.g. payment transaction records).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">10. Changes to this policy</h2>
            <p>We may update this policy from time to time. Material changes will be reflected by updating the "Last updated" date above.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">11. Contact</h2>
            <p>Questions about this policy can be sent to <a href="mailto:support@quantumcv.app" className="text-[var(--accent)] hover:underline">support@quantumcv.app</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
