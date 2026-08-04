import { sendEmail } from './email';

const BRAND_HEAD = `
  body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .card { max-width: 480px; margin: 40px auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
  .logo-icon { width: 38px; height: 38px; background: #1d9bf0; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1rem; font-weight: 700; }
  .logo-text { font-size: 1.1rem; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  h2 { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
  .subtitle { color: #64748b; margin: 0 0 28px; line-height: 1.6; font-size: 0.95rem; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 0.8rem; color: #cbd5e1; line-height: 1.6; }
`;

function wrap(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${BRAND_HEAD}</style></head>
<body>
  <div class="card">
    <div class="logo"><div class="logo-icon">Q</div><span class="logo-text">QuantumCV</span></div>
    ${bodyHtml}
    <div class="footer">
      <p>© 2026 QuantumCV, quantumcv.app. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ── OTP ──────────────────────────────────────────────
const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES ?? 10);

export async function sendOtpEmail(email: string, code: string): Promise<boolean> {
  const html = wrap(`
    <h2>Your Verification Code</h2>
    <p class="subtitle">Use this code to sign in to QuantumCV. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
    <div style="background:#eff6ff;border:2px dashed #bfdbfe;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
      <p style="font-size:2.5rem;font-weight:800;color:#1d9bf0;letter-spacing:0.3em;font-family:'Monaco','Courier New',monospace;margin:0">${code}</p>
      <div style="color:#94a3b8;font-size:0.8rem;margin-top:12px">⏱ Expires in ${OTP_EXPIRY_MINUTES} minutes</div>
    </div>
    <p style="color:#64748b;font-size:0.85rem">If you didn't request this code, you can safely ignore this email.</p>
  `);
  const text = `Your QuantumCV verification code is:\n\n${code}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\nIf you didn't request this, you can safely ignore this email.\n\n— QuantumCV Team`;

  return sendEmail({ to: email, subject: '🔐 Your QuantumCV Verification Code', html, text });
}

// ── Payment confirmation ────────────────────────────
export async function sendPaymentConfirmationEmail(params: {
  email: string;
  fullName: string;
  planName: string;
  amount: number;
  currency: string;
  credits: number;
  orderId: string;
  paymentId: string;
}): Promise<boolean> {
  const { email, fullName, planName, amount, currency, credits, orderId, paymentId } = params;
  const currencySymbol = currency === 'INR' ? '₹' : '$';
  const html = wrap(`
    <h2>Payment received — thank you!</h2>
    <p class="subtitle">Hi ${fullName || 'there'}, your credit pack purchase is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <tr><td style="padding:8px 0;color:#64748b;font-size:0.85rem">Plan</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:0.9rem">${planName}</td></tr>
      <tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:0.85rem">Amount paid</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:0.9rem">${currencySymbol}${amount}</td></tr>
      <tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:0.85rem">Credits added</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#1d9bf0;font-size:0.9rem">+${credits}</td></tr>
      <tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:0.85rem">Order ID</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:0.78rem">${orderId}</td></tr>
      <tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;font-size:0.85rem">Payment ID</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-size:0.78rem">${paymentId}</td></tr>
    </table>
    <p style="color:#64748b;font-size:0.85rem">You can view your full billing history anytime at quantumcv.app/billing.</p>
  `);
  const text = `Payment received — thank you!\n\nPlan: ${planName}\nAmount paid: ${currencySymbol}${amount}\nCredits added: +${credits}\nOrder ID: ${orderId}\nPayment ID: ${paymentId}\n\nView your billing history at quantumcv.app/billing\n\n— QuantumCV Team`;

  return sendEmail({ to: email, subject: `✅ Payment confirmed — ${credits} credits added`, html, text });
}

// ── Support: new message notifies the site's support inbox ──
export async function notifySupportInboxOfNewMessage(params: {
  fromEmail: string;
  fromName: string;
  message: string;
  threadId: number;
}): Promise<boolean> {
  const { fromEmail, fromName, message, threadId } = params;
  const supportInbox = process.env.SUPPORT_INBOX_EMAIL || 'support@quantumcv.app';
  const html = wrap(`
    <h2>New support message</h2>
    <p class="subtitle">From ${fromName || fromEmail} (${fromEmail}) — thread #${threadId}</p>
    <div style="background:#f8fafc;border-radius:12px;padding:20px;color:#0f172a;font-size:0.9rem;line-height:1.6;white-space:pre-wrap">${message}</div>
    <p style="margin-top:20px"><a href="https://quantumcv.app/admin/support/${threadId}" style="color:#1d9bf0;text-decoration:none;font-weight:600">Reply in admin dashboard →</a></p>
  `);
  const text = `New support message from ${fromName || fromEmail} (${fromEmail}) — thread #${threadId}:\n\n${message}\n\nReply at: https://quantumcv.app/admin/support/${threadId}`;

  return sendEmail({
    to: supportInbox,
    subject: `New support message from ${fromName || fromEmail}`,
    html,
    text,
    replyTo: fromEmail,
  });
}

// ── Support: admin's reply notifies the user ──
export async function sendSupportReplyEmail(params: {
  email: string;
  fullName: string;
  message: string;
  threadId: number;
}): Promise<boolean> {
  const { email, fullName, message, threadId } = params;
  const html = wrap(`
    <h2>Team QuantumCV replied</h2>
    <p class="subtitle">Hi ${fullName || 'there'}, you have a new reply to your support request.</p>
    <div style="background:#f8fafc;border-radius:12px;padding:20px;color:#0f172a;font-size:0.9rem;line-height:1.6;white-space:pre-wrap">${message}</div>
    <p style="margin-top:20px"><a href="https://quantumcv.app/dashboard/support" style="color:#1d9bf0;text-decoration:none;font-weight:600">View & reply →</a></p>
  `);
  const text = `Team QuantumCV replied:\n\n${message}\n\nView & reply at: https://quantumcv.app/dashboard/support`;

  return sendEmail({ to: email, subject: 'Team QuantumCV replied to your message', html, text });
}
