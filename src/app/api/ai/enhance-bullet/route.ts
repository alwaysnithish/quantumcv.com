import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { enhanceBullet } from '@/lib/gemini';
import { deductCredits, getCredits, InsufficientCreditsError, CREDIT_COSTS } from '@/lib/credits';

/** POST /api/ai/enhance-bullet — port of resume/views.py::enhance_bullet_view */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json().catch(() => ({}));
  const bullet: string = (body.bullet ?? '').trim();
  const context: string = (body.context ?? '').trim();

  if (!bullet) {
    return NextResponse.json({ success: false, message: 'Bullet text is required.' }, { status: 400 });
  }

  const balance = await getCredits(auth.id);
  if (balance < CREDIT_COSTS.enhance_bullet) {
    return NextResponse.json(
      {
        success: false,
        code: 'insufficient_credits',
        message: `You need ${CREDIT_COSTS.enhance_bullet} credit to enhance a point — you have ${balance}. Buy more credits to continue.`,
        required: CREDIT_COSTS.enhance_bullet,
        available: balance,
      },
      { status: 402 }
    );
  }

  try {
    const improved = await enhanceBullet(bullet, context);
    let newBalance: number;
    try {
      newBalance = await deductCredits(auth.id, 'enhance_bullet');
    } catch (err) {
      if (err instanceof InsufficientCreditsError) {
        return NextResponse.json(
          { success: false, code: 'insufficient_credits', message: 'Insufficient credits.' },
          { status: 402 }
        );
      }
      throw err;
    }
    return NextResponse.json({ success: true, improved, credits_remaining: newBalance });
  } catch (err: any) {
    console.error('Bullet enhance error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
