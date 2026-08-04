import Nav from '@/components/nav';
import Footer from '@/components/footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'QuantumCV Terms of Service.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      <main className="max-w-3xl mx-auto px-5 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-[var(--fg-muted)] mb-10">Last updated: July 2026</p>

        <div className="prose-like space-y-8 text-sm leading-relaxed text-[var(--fg-muted)]">
          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">1. Acceptance of terms</h2>
            <p>By accessing or using QuantumCV ("the Service"), operated at quantumcv.app, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">2. Description of service</h2>
            <p>QuantumCV is an AI-powered resume building platform that generates, edits, and formats resumes based on information you provide. Certain features (AI resume generation, AI chat editing, AI bullet enhancement) consume credits, which are purchased in packs as described on our Pricing page.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">3. Accounts</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account and for all activity that occurs under it. Sign-in is passwordless (email verification code or Google sign-in) — do not share access to your email account with others if you want to keep your QuantumCV account secure.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">4. Credits and payments</h2>
            <p>Credits are purchased as one-time, non-subscription packs and do not expire. Credits are consumed when you use AI-powered features (resume generation, AI chat edits, AI bullet/skill enhancement) as described on the Pricing page at the time of purchase. Credits have no cash value and are non-transferable between accounts.</p>
            <p className="mt-2">Refund requests for unused credit packs may be sent to support@quantumcv.app and are considered on a case-by-case basis.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">5. Content you provide</h2>
            <p>You retain ownership of any career data, resume content, and other information you submit to the Service. You grant QuantumCV a limited license to process this data solely for the purpose of providing the Service to you (e.g. sending it to our AI provider to generate resume content). You are responsible for ensuring the information you submit is accurate and that you have the right to share it.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">6. AI-generated content</h2>
            <p>Resume content is generated using third-party AI models. While we aim for high-quality, accurate output, AI-generated text may occasionally contain errors or require your review and editing. You are responsible for reviewing any AI-generated resume content before using it to apply for jobs.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">7. Acceptable use</h2>
            <p>You agree not to use the Service to generate fraudulent, misleading, or plagiarized content intended to misrepresent your qualifications, or to attempt to disrupt, reverse-engineer, or gain unauthorized access to the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">8. Termination</h2>
            <p>We may suspend or terminate accounts that violate these terms. You may stop using the Service and request account deletion at any time by contacting support@quantumcv.app.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">9. Disclaimer of warranties</h2>
            <p>The Service is provided "as is" without warranties of any kind. We do not guarantee that use of the Service will result in job offers, interviews, or any specific employment outcome.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">10. Limitation of liability</h2>
            <p>To the maximum extent permitted by law, QuantumCV shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">11. Changes to these terms</h2>
            <p>We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--fg)] mb-2">12. Contact</h2>
            <p>Questions about these terms can be sent to <a href="mailto:support@quantumcv.app" className="text-[var(--accent)] hover:underline">support@quantumcv.app</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
