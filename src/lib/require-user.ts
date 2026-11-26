import { getCurrentUserId } from './session';
import { getUserById } from './users';
import { NextResponse } from 'next/server';

/**
 * Replaces Django's @login_required(login_url='/') decorator for API routes.
 * Returns the authenticated user row, or throws a NextResponse (401) that
 * the caller should return directly. Usage:
 *
 *   const auth = await requireUser();
 *   if (auth instanceof NextResponse) return auth;
 *   const user = auth;
 */
export async function requireUser() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }
  return user;
}
