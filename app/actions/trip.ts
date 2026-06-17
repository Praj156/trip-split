'use server';

import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function createTripWithMembers({
  name,
  startDate,
  endDate,
  currency,
  memberNames,
}: {
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  memberNames: string[];
}): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) throw new Error('User not found in database');

  const trip = await db.trip.create({
    data: {
      name,
      currency,
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

export async function updateTripStatus(tripId: string, status: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await db.trip.update({
    where: { id: tripId, userId: user.id },
    data: { status },
  });
}

export async function deleteTrip(tripId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await db.trip.delete({
    where: { id: tripId, userId: user.id },
  });
}

export async function updateTripDetails(tripId: string, data: { name: string; startDate: string; endDate: string; currency: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  await db.trip.update({
    where: { id: tripId, userId: user.id },
    data: {
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      currency: data.currency,
    },
  });
}

export async function createTrip(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const dbUser = await db.user.findUnique({ where: { id: user.id } });
  if (!dbUser) throw new Error('User not found');

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

export async function updateTripWithMembers({
  tripId,
  name,
  startDate,
  endDate,
  currency,
  memberNames,
}: {
  tripId: string;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  memberNames: string[];
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');

  const trip = await db.trip.findUnique({
    where: { id: tripId, userId: user.id },
    include: { members: true },
  });
  if (!trip) throw new Error('Trip not found');

  const existingNames = trip.members.map(m => m.name.toLowerCase());
  const newNamesLowerCase = memberNames.map(n => n.toLowerCase());
  
  // Find members to remove (case insensitive)
  const membersToRemove = trip.members.filter(m => !newNamesLowerCase.includes(m.name.toLowerCase()));
  
  // Find members to add (names that don't match existing)
  const namesToAdd = memberNames.filter(n => !existingNames.includes(n.toLowerCase()));

  if (membersToRemove.length > 0) {
    const membersWithExpenses = await db.member.findMany({
      where: {
        id: { in: membersToRemove.map(m => m.id) },
        expenses: { some: {} }
      }
    });
    if (membersWithExpenses.length > 0) {
      throw new Error(`Cannot remove members with expenses logged.`);
    }
  }

  await db.$transaction(async (tx) => {
    await tx.trip.update({
      where: { id: tripId },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        currency,
      }
    });

    if (membersToRemove.length > 0) {
      await tx.member.deleteMany({
        where: { id: { in: membersToRemove.map(m => m.id) } }
      });
    }

    if (namesToAdd.length > 0) {
      await tx.member.createMany({
        data: namesToAdd.map(n => ({ name: n, tripId }))
      });
    }
  });
}