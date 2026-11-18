import 'server-only';
import { db } from '@/lib/db';

/** Loads a trip with members and expenses, as plain JSON for client components. */
export async function loadSerializedTrip(tripId: string) {
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      members: {
        // id breaks ties: members added together share a timestamp, and the settlement
        // pairing depends on member order, so it must be the same on every page.
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { expenses: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
      },
    },
  });
  if (!trip) return null;

  return {
    id: trip.id,
    name: trip.name,
    status: trip.status,
    currency: trip.currency,
    startDate: trip.startDate ? trip.startDate.toISOString() : null,
    endDate: trip.endDate ? trip.endDate.toISOString() : null,
    members: trip.members.map((m) => ({
      id: m.id,
      name: m.name,
      expenses: m.expenses.map((e) => ({
        id: e.id,
        description: e.description || '',
        amount: e.amount,
        sharedWithIds: e.sharedWithIds || [],
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
    })),
  };
}

export type SerializedTrip = NonNullable<Awaited<ReturnType<typeof loadSerializedTrip>>>;
