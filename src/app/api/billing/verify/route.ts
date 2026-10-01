import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { createHmac } from 'crypto';
import { PLANS, PlanId, Currency, toSmallestUnit } from '@/lib/plans';
import { addCreditsFromPurchase } from '@/lib/credits';
import { sendPaymentConfirmationEmail } from '@/lib/notifications';

/**
 * Called from the client after Razorpay's checkout widget completes.
 * Verifies the payment signature server-side (never trust the client's
 * word that a payment succeeded) before crediting the account.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, currency } = body as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    plan?: PlanId;
    currency?: Currency;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan || !PLANS[plan]) {
    return NextResponse.json({ success: false, message: 'Missing payment details.' }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ success: false, message: 'Payments are not configured.' }, { status: 501 });
  }

  const expectedSignature = createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ success: false, message: 'Payment signature verification failed.' }, { status: 400 });
  }

  const planDef = PLANS[plan];
  const emailCurrency: Currency = currency === 'INR' ? 'INR' : 'USD';
  const result = await addCreditsFromPurchase(
    auth.id,
    planDef.credits,
    razorpay_order_id,
    razorpay_payment_id,
    emailCurrency,
    toSmallestUnit(planDef.price[emailCurrency])
  );

  // Payment confirmation email — best-effort, never blocks the response
  // (the purchase itself already succeeded; email failure shouldn't look
  // like a failed payment to the user).
  sendPaymentConfirmationEmail({
    email: auth.email,
    fullName: auth.fullName,
    planName: plan === 'pro' ? 'Pro' : 'Starter',
    amount: planDef.price[emailCurrency],
    currency: emailCurrency,
    credits: planDef.credits,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  }).catch((err) => console.error('Payment confirmation email failed:', err));

  return NextResponse.json({ success: true, credits_added: planDef.credits, new_balance: result.newBalance });
}
