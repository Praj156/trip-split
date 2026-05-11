'use server';

import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function checkUser() {
  const user = await getCurrentUser();

  if (!user) return null;

  const loggedInUser = await db.user.findUnique({
    where: { id: user.id },
  });

  if (loggedInUser) return loggedInUser;

  const newUser = await db.user.create({
    data: {
      id: user.id,
      email: user.email || '',
    },
  });

  return newUser;
}