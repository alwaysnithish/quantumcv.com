/**
 * src/lib/email.ts
 *
 * Generic email sending — two transports, tried in this order:
 *
 * 1. Resend (HTTP API) — used if RESEND_API_KEY is set. Recommended now
 *    that quantumcv.app is a verified domain (Resend Dashboard -> Domains
 *    -> Add Domain -> add the DNS records). HTTP-based sending also
 *    sidesteps the raw-SMTP reliability problems seen on serverless hosts.
 *
 * 2. SMTP via nodemailer — used if RESEND_API_KEY is not set but
 *    SMTP_HOST/USER/PASS are. Host is resolved to an explicit IPv4 address
 *    before connecting to avoid ENETUNREACH on hosts with broken IPv6.
 *
 * 3. Dev console fallback — if neither is configured, the email content is
 *    logged to the console instead of failing.
 *
 * All specific email templates (OTP, payment receipt, support
 * notifications) live in src/lib/notifications.ts and call sendEmail()
 * from here — this file only knows how to deliver a { to, subject, html,
 * text } payload, not what any particular email says.
 */
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { resolve4 } from 'dns/promises';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

async function sendViaResend(payload: EmailPayload): Promise<boolean> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'QuantumCV <no-reply@quantumcv.app>',
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      replyTo: payload.replyTo,
    });
    if (error) {
      console.error('Resend error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send email via Resend:', err);
    return false;
  }
}

async function resolveSmtpIPv4(hostname: string): Promise<string | null> {
  try {
    const addresses = await resolve4(hostname);
    return addresses[0] ?? null;
  } catch (err) {
    console.warn(`Could not resolve IPv4 address for ${hostname}, falling back to hostname:`, err);
    return null;
  }
}

async function sendViaSmtp(payload: EmailPayload): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false;

  const port = Number(SMTP_PORT ?? 587);
  const resolvedIp = await resolveSmtpIPv4(SMTP_HOST);

  try {
    const transport = nodemailer.createTransport({
      host: resolvedIp ?? SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      family: 4,
      tls: resolvedIp ? { servername: SMTP_HOST } : undefined,
    } as nodemailer.TransportOptions);

    await transport.sendMail({
      from: process.env.SMTP_FROM ?? `QuantumCV <${SMTP_USER}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
      replyTo: payload.replyTo,
    });
    return true;
  } catch (err) {
    console.error('Failed to send email via SMTP:', err);
    return false;
  }
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (process.env.RESEND_API_KEY) return sendViaResend(payload);
  if (process.env.SMTP_HOST) return sendViaSmtp(payload);
  console.warn(`[DEV] No email provider configured. Would have sent to ${payload.to}: "${payload.subject}"`);
  console.warn(payload.text);
  return process.env.NODE_ENV !== 'production';
}
