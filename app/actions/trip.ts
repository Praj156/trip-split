'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { checkUser } from '@/lib/auth';
import { requireOwnedTrip } from '@/lib/access';
import { cleanText, hasLetterOrDigit, isCurrency, isDateInRange, LIMITS, parseDateInput } from '@/lib/validation';

// Server actions return errors instead of throwing, because Next.js hides
// thrown error messages from the browser in production builds.
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

interface TripInput {
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  memberNames: string[];
}

function validateTrip(input: TripInput) {
  const name = cleanText(input.name, LIMITS.tripName);
  if (!name || !hasLetterOrDigit(name)) return { error: 'Give the trip a name with at least one letter or number.' } as const;

  const endInput = input.endDate || input.startDate;
  if (!isDateInRange(input.startDate) || !isDateInRange(endInput)) {
    return { error: 'Choose real trip dates between the years 2000 and 2100.' } as const;
  }
  const start = parseDateInput(input.startDate);
  const end = parseDateInput(endInput);
  if (!start || !end) return { error: 'Choose valid trip dates.' } as const;
  if (end < start) return { error: 'End date must be on or after the start date.' } as const;

  if (!isCurrency(input.currency)) return { error: 'Choose a supported currency.' } as const;

  const names: string[] = [];
  for (const raw of input.memberNames ?? []) {
    const n = cleanText(raw, LIMITS.memberName);
    if (n && !hasLetterOrDigit(n)) return { error: `“${n}” isn’t a valid member name. Use at least one letter or number.` } as const;
    if (n && !names.some((x) => x.toLowerCase() === n.toLowerCase())) names.push(n);
  }
  if (names.length < 2) return { error: 'Add at least 2 members.' } as const;
  if (names.length > LIMITS.members) return { error: `A trip can have up to ${LIMITS.members} members.` } as const;

  return { value: { name, start, end, currency: input.currency, names } } as const;
}

export async function createTripWithMembers(input: TripInput): Promise<ActionResult<string>> {
  const user = await checkUser();
  if (!user) return { ok: false, error: 'Your session has expired. Sign in again.' };

  const v = validateTrip(input);
  if ('error' in v) return { ok: false, error: v.error! };

  const trip = await db.trip.create({
    data: {
      name: v.value.name,
      currency: v.value.currency,
      startDate: v.value.start,
      endDate: v.value.end,
      userId: user.id,
      // Staggered timestamps keep members in the order they were entered.
      members: { create: v.value.names.map((name, i) => ({ name, createdAt: new Date(Date.now() + i) })) },
    },
  });

  revalidatePath('/dashboard');
  return { ok: true, data: trip.id };
}

export async function updateTripWithMembers(
  input: TripInput & { tripId: string },
): Promise<ActionResult> {
  let trip;
  try {
    trip = await requireOwnedTrip(input.tripId);
  } catch {
    return { ok: false, error: 'Trip not found.' };
  }

  if (trip.status !== 'active') {
    return { ok: false, error: 'This trip is completed. Reopen it before making changes.' };
  }

  const v = validateTrip(input);
  if ('error' in v) return { ok: false, error: v.error! };

  const members = await db.member.findMany({ where: { tripId: trip.id } });
  const wanted = v.value.names.map((n) => n.toLowerCase());
  const existing = members.map((m) => m.name.toLowerCase());

  const toRemove = members.filter((m) => !wanted.includes(m.name.toLowerCase()));
  const toAdd = v.value.names.filter((n) => !existing.includes(n.toLowerCase()));

  if (toRemove.length > 0) {
    const payers = await db.member.findMany({
      where: { id: { in: toRemove.map((m) => m.id) }, expenses: { some: {} } },
      select: { name: true },
    });
    if (payers.length > 0) {
      return {
        ok: false,
        error: `${payers.map((p) => p.name).join(', ')} paid for expenses on this trip. Delete those expenses before removing them.`,
      };
    }
  }

  const removedIds = new Set(toRemove.map((m) => m.id));

  await db.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id: trip.id },
      data: {
        name: v.value.name,
        startDate: v.value.start,
        endDate: v.value.end,
        currency: v.value.currency,
      },
    });

    if (removedIds.size > 0) {
      // Take removed members out of every split they were part of, so their
      // share is spread over the remaining people instead of vanishing.
      const affected = await tx.expense.findMany({
        where: { tripId: trip.id, sharedWithIds: { hasSome: [...removedIds] } },
      });
      for (const e of affected) {
        const remaining = e.sharedWithIds.filter((id) => !removedIds.has(id));
        await tx.expense.update({
          where: { id: e.id },
          data: { sharedWithIds: remaining.length > 0 ? remaining : [e.paidById] },
        });
      }
      await tx.member.deleteMany({ where: { id: { in: [...removedIds] }, tripId: trip.id } });
    }

    if (toAdd.length > 0) {
      await tx.member.createMany({ data: toAdd.map((name, i) => ({ name, tripId: trip.id, createdAt: new Date(Date.now() + i) })) });
    }
  });

  revalidatePath(`/wizard/${trip.id}`, 'layout');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

export async function updateTripStatus(tripId: string, status: string): Promise<ActionResult> {
  if (status !== 'active' && status !== 'completed') return { ok: false, error: 'Unknown status.' };
  try {
    const trip = await requireOwnedTrip(tripId);
    await db.trip.update({ where: { id: trip.id }, data: { status } });
  } catch {
    return { ok: false, error: 'Trip not found.' };
  }
  revalidatePath(`/wizard/${tripId}`, 'layout');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

export async function deleteTrip(tripId: string): Promise<ActionResult> {
  try {
    const trip = await requireOwnedTrip(tripId);
    await db.trip.delete({ where: { id: trip.id } });
  } catch {
    return { ok: false, error: 'Trip not found.' };
  }
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}
