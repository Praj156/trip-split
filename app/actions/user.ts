'use server';

import { revalidatePath } from 'next/cache';
import { checkUser, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { cleanText, hasLetterOrDigit, isCurrency } from '@/lib/validation';
import type { ActionResult } from './trip';

export async function getUserProfile() {
  return checkUser();
}

export async function updateProfile(data: { name: string; defaultCurrency: string }): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Your session has expired. Sign in again.' };
  if (!isCurrency(data.defaultCurrency)) return { ok: false, error: 'Choose a supported currency.' };
  const name = cleanText(data.name, 60);
  if (name && !hasLetterOrDigit(name)) return { ok: false, error: 'Your name needs at least one letter.' };

  await db.user.update({
    where: { id: user.id },
    data: { name: name || null, defaultCurrency: data.defaultCurrency },
  });
  revalidatePath('/profile');
  return { ok: true, data: undefined };
}
