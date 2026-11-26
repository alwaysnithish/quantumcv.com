import { NextRequest, NextResponse } from 'next/server';
import { TOOL_BY_SLUG, type ToolSlug } from '@/lib/tools-config';
import { buildToolPrompt } from '@/lib/tools-prompts';
import { generateToolJson, generateToolText } from '@/lib/gemini';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { getCurrentUserId } from '@/lib/session';

export const maxDuration = 60;

const GUEST_DAILY = 6;
const USER_DAILY = 30;
const DAY = 24 * 3600;

type Params = { params: Promise<{ slug: string }> };

/** POST /api/tools/[slug] — free preview, costs 0 credits. Rate limited per IP / user. */
export async function POST(request: NextRequest, { params }: Params) {
  const { slug } = await params;
  const tool = TOOL_BY_SLUG[slug];
  if (!tool) return NextResponse.json({ success: false, message: 'Unknown tool.' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const values: Record<string, string> = {};
  for (const f of tool.fields) {
    const raw = typeof body?.[f.name] === 'string' ? body[f.name].trim() : '';
    if (f.required && !raw) return NextResponse.json({ success: false, message: `${f.label} is required.` }, { status: 400 });
    if (raw.length > f.maxLength) return NextResponse.json({ success: false, message: `${f.label} is too long (max ${f.maxLength} characters).` }, { status: 400 });
    if (f.type === 'select' && raw && f.options && !f.options.includes(raw)) return NextResponse.json({ success: false, message: 'Invalid option.' }, { status: 400 });
    values[f.name] = raw;
  }

  const userId = await getCurrentUserId();
  const key = userId ? `tool:u:${userId}` : `tool:ip:${clientIp(request.headers)}`;
  const limit = await rateLimit(key, userId ? USER_DAILY : GUEST_DAILY, DAY).catch(() => ({ allowed: true, remaining: 0, count: 0 }));
  if (!limit.allowed) {
    return NextResponse.json(
      {
        success: false,
        code: 'rate_limited',
        message: userId
          ? 'You have reached today’s free limit for AI tools. Try again tomorrow.'
          : `You have used today’s ${GUEST_DAILY} free previews. Create a free account for more.`,
      },
      { status: 429 }
    );
  }

  const { prompt, json, maxTokens } = buildToolPrompt(slug as ToolSlug, values);
  try {
    const result = json ? await generateToolJson(prompt, maxTokens) : { letter: await generateToolText(prompt, maxTokens) };
    return NextResponse.json({ success: true, result, remaining: limit.remaining });
  } catch (err) {
    console.error(`tool ${slug} error:`, err);
    return NextResponse.json({ success: false, message: 'The AI is busy right now. Please try again in a moment.' }, { status: 502 });
  }
}
