'use server';

import { db } from '@/lib/db';
import { isValidEmail, normalizeEmail } from '@/lib/validation';

export type AccountStatus = 'none' | 'unconfirmed' | 'confirmed' | 'invalid';

/**
 * Looks up whether an email already has a TripSplit account, so sign-up can
 * send existing users to sign in and forgot-password can tell people when
 * no account exists. (The owner chose clear messages over hiding which
 * emails are registered.)
 */
export async function lookupAccount(rawEmail: string): Promise<AccountStatus> {
  const email = normalizeEmail(String(rawEmail ?? ''));
  if (!isValidEmail(email)) return 'invalid';

  try {
    // Supabase keeps accounts in auth.users; the app's database role can read it.
    const rows = await db.$queryRaw<{ confirmed: boolean }[]>`
      select (email_confirmed_at is not null) as confirmed
      from auth.users
      where lower(email) = ${email} and deleted_at is null
      limit 1`;
    if (rows.length === 0) return 'none';
    return rows[0].confirmed ? 'confirmed' : 'unconfirmed';
  } catch {
    // Fallback (e.g. auth schema not readable): users who have signed in at least once.
    const user = await db.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    return user ? 'confirmed' : 'none';
  }
}
