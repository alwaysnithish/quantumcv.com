import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { verifyUnsubscribeToken } from '@/lib/lifecycle-emails';

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><body style="font-family:system-ui,sans-serif;background:#eef3f9;display:grid;place-items:center;min-height:100vh;margin:0"><div style="background:#fff;border:1px solid #dbe4ef;border-radius:16px;padding:32px;max-width:420px;text-align:center"><h2 style="margin:0 0 8px">${title}</h2><p style="color:#475569;line-height:1.6">${body}</p><a href="/" style="color:#1d9bf0;font-weight:600">Back to QuantumCV</a></div></body>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

export async function GET(request: NextRequest) {
  const uid = await verifyUnsubscribeToken(request.nextUrl.searchParams.get('token') ?? '');
  if (!uid) return page('Link not valid', 'This unsubscribe link is invalid or has expired.', 400);
  await db.update(users).set({ emailOptOut: true }).where(eq(users.id, uid));
  return page('You’re unsubscribed', 'We won’t send you reminder emails any more. Sign-in codes, receipts and reports you request still arrive.');
}
