import { db } from '@/db/client';
import { users, creditTransactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function getOrCreateUserByEmail(email: string, fullName = '') {
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { user: existing, created: false };

  const id = randomUUID();
  await db.insert(users).values({ id, email, fullName });
  await db.insert(creditTransactions).values({
    userId: id,
    type: 'bonus',
    amount: 10,
    status: 'completed',
  });
  const [created] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return { user: created, created: true };
}

export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function getUserByGoogleId(googleId: string) {
  const [user] = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
  return user ?? null;
}

/** Initials for avatar display — mirrors User.avatar_initials in accounts/models.py */
export function avatarInitials(user: { fullName: string; email: string }): string {
  if (user.fullName) {
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() ?? 'U';
  }
  return user.email[0]?.toUpperCase() ?? 'U';
}

/** mirrors User.display_name */
export function displayName(user: { fullName: string; email: string }): string {
  return user.fullName || user.email.split('@')[0];
}
