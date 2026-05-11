'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

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
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error('User not found in database');

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

export async function createTrip(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');

  const user = await db.user.findUnique({ where: { id: session.user.id } });
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