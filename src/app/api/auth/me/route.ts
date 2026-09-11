import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/session';
import { getUserById, avatarInitials, displayName } from '@/lib/users';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ user: null }, { status: 200 });

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      initials: avatarInitials(user),
      displayName: displayName(user),
      credits: user.credits,
      premiumUnlocked: user.premiumUnlocked,
    },
  });
}
