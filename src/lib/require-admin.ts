import { getCurrentUserId } from './session';
import { getUserById } from './users';
import { NextResponse } from 'next/server';

/**
 * Same pattern as requireUser(), but additionally checks isStaff. Returns
 * the user row, or a NextResponse (401/403) the caller should return
 * directly. There's no self-serve way to become an admin — the first
 * admin account is set directly in the database (see README).
 */
export async function requireAdmin() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
  }
  if (!user.isStaff) {
    return NextResponse.json({ success: false, message: 'Admin access required.' }, { status: 403 });
  }
  return user;
}
