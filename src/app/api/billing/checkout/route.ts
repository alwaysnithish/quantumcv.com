import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { PLANS, toSmallestUnit, PlanId, Currency } from '@/lib/plans';

/**
 * Creates a Razorpay order for a credit pack purchase. Requires
 * RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to be set — until then this
 * returns a clear "payments not configured" message rather than pretending
 * to work. Uses Razorpay's REST API directly (no SDK dependency) since
 * order creation is a single simple POST request.
 */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const plan: PlanId = body.plan;
  const currency: Currency = body.currency === 'INR' ? 'INR' : 'USD';

  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ success: false, message: 'Invalid plan.' }, { status: 400 });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      {
        success: false,
        code: 'payments_not_configured',
        message: 'Payments are not set up yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable purchases.',
      },
      { status: 501 }
    );
  }

  const planDef = PLANS[plan];
  const amount = toSmallestUnit(planDef.price[currency]);

  try {
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'),
      },
      body: JSON.stringify({
        amount,
        currency,
        notes: { userId: auth.id, plan, credits: planDef.credits },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Razorpay order creation failed:', errBody);
      return NextResponse.json({ success: false, message: 'Could not create order.' }, { status: 500 });
    }

    const order = await res.json();
    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount,
      currency,
      key_id: keyId, // public key, safe to expose to client for the checkout widget
      plan,
      credits: planDef.credits,
    });
  } catch (err) {
    console.error('Razorpay order creation error:', err);
    return NextResponse.json({ success: false, message: 'Could not reach payment provider.' }, { status: 500 });
  }
}
