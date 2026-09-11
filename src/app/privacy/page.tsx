import Link from 'next/link';
import LegalPage from '@/components/legal-page';

export const metadata = {
  title: 'Privacy Policy — QuantumCV',
  description: 'What QuantumCV collects, why, and how you can control it.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      description="A plain-language explanation of what we collect, why, and how you stay in control of it."
      sections={[
        {
          title: 'Information we collect',
          content: (
            <ul>
              <li>Account details — name, email, and authentication data (including via Google Sign-In).</li>
              <li>The career data, job descriptions, and preferences you enter to build a resume.</li>
              <li>Resume versions, template choices, and ATS scores generated while you use the builder.</li>
              <li>Billing details needed to process payments (handled by Razorpay — we don&apos;t store card numbers).</li>
              <li>Basic usage data (pages visited, actions taken) to keep the product working and improve it.</li>
            </ul>
          ),
        },
        {
          title: 'How we use it',
          content: (
            <ul>
              <li>To generate, store, and let you edit your resumes.</li>
              <li>To process payments and manage your credit balance.</li>
              <li>To respond to support requests through the chat widget or email.</li>
              <li>To improve reliability and catch bugs across the product.</li>
            </ul>
          ),
        },
        {
          title: 'AI processing',
          content: (
            <p>
              When you generate or edit a resume, the career data you submit is sent to our AI provider (Google
              Gemini) to produce the resume content. This data is processed to generate your response and is not
              used by us to train models.
            </p>
          ),
        },
        {
          title: 'Cookies & similar technology',
          content: (
            <p>
              We use essential cookies to keep you signed in and remember preferences like light/dark theme. We
              don&apos;t use third-party advertising trackers.
            </p>
          ),
        },
        {
          title: 'Sharing your data',
          content: (
            <p>
              We don&apos;t sell your data. We share the minimum necessary information with service providers who
              help run QuantumCV — hosting, the AI model provider, and Razorpay for payments — each bound by their
              own confidentiality and security obligations.
            </p>
          ),
        },
        {
          title: 'Data retention',
          content: (
            <p>
              Your resumes and account data are kept as long as your account is active. If you delete your account,
              we remove your resumes and personal data within 30 days, except where we&apos;re required to retain
              billing records for legal or tax purposes.
            </p>
          ),
        },
        {
          title: 'Your rights',
          content: (
            <ul>
              <li>Access or export the resumes and data associated with your account at any time from your dashboard.</li>
              <li>Correct inaccurate account information.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Reach out with any privacy question — see contact details below.</li>
            </ul>
          ),
        },
        {
          title: "Children's privacy",
          content: <p>QuantumCV isn&apos;t directed at children under 16, and we don&apos;t knowingly collect data from them.</p>,
        },
        {
          title: 'Changes to this policy',
          content: <p>We&apos;ll post updates here and, for material changes, notify you in-app or by email.</p>,
        },
        {
          title: 'Contact',
          content: (
            <p>
              Questions about your data? Email{' '}
              <a href="mailto:support@quantumcv.app">support@quantumcv.app</a> or visit the{' '}
              <Link href="/contact">contact page</Link>.
            </p>
          ),
        },
      ]}
    />
  );
}