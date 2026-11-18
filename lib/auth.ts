import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';

/**
 * Returns the signed-in Supabase user, verified with the auth server.
 * (getSession() only decodes the cookie, so it must not be trusted on the server.)
 * Cached per request so layouts and pages share one lookup.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/** Returns the app's User row for the signed-in user, creating it on first visit. */
export const checkUser = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const existing = await db.user.findUnique({ where: { id: user.id } });
  if (existing) return existing;
  try {
    return await db.user.create({ data: { id: user.id, email: user.email ?? '' } });
  } catch (e) {
    // Two requests on a user's first visit can race to create the row;
    // the loser just reads what the winner wrote.
    if ((e as { code?: string }).code === 'P2002') {
      const row = await db.user.findUnique({ where: { id: user.id } });
      if (row) return row;
    }
    throw e;
  }
});
