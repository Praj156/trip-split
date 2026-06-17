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

export async function checkEmailExists(email: string) {
  const user = await db.user.findUnique({
    where: { email },
  });
  return !!user;
}

export async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  return db.user.findUnique({ where: { id: user.id } });
}

export async function updateProfile(data: { name: string; defaultCurrency: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  return db.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      defaultCurrency: data.defaultCurrency,
    },
  });
}