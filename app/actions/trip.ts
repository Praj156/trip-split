'use server';

import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// ── Create trip + members in a single action (for combined Step 1) ──────────
export async function createTripWithMembers({
  name,
  startDate,
  endDate,
  memberNames,
}: {
  name: string;
  startDate: string;
  endDate: string;
  memberNames: string[];
}): Promise<string> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error('Unauthorized');

  // Find the internal DB user
  const user = await db.user.findUnique({ where: { id: clerkUserId } });
  if (!user) throw new Error('User not found in database');

  // Create trip + all members in a single transaction
  const trip = await db.trip.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userId: user.id,
      members: {
        create: memberNames.map(memberName => ({ name: memberName })),
      },
    },
  });

  return trip.id;
}

// ── Original single-trip create (kept for backwards compat) ─────────────────
export async function createTrip(formData: FormData) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { id: clerkUserId } });
  if (!user) throw new Error('User not found');

  const trip = await db.trip.create({
    data: {
      name: formData.get('name') as string,
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
      userId: user.id,
    },
  });

  return trip.id;
}