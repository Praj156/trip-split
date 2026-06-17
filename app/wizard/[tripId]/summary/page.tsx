import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import SummaryView from './SummaryView';

export default async function SummaryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      members: {
        include: {
          expenses: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  });

  if (!trip) notFound();

  // Safely serialize Prisma Date objects to plain JSON strings for the Client Component
  const serializedTrip = {
    id: trip.id,
    name: trip.name,
    status: trip.status,
    currency: trip.currency,
    startDate: trip.startDate ? trip.startDate.toISOString() : null,
    endDate: trip.endDate ? trip.endDate.toISOString() : null,
    members: trip.members.map(m => ({
      id: m.id,
      name: m.name,
      expenses: m.expenses.map(e => ({
        id: e.id,
        description: e.description || '',
        amount: e.amount,
        sharedWithIds: e.sharedWithIds || [],
        date: e.date.toISOString(),
      }))
    }))
  };

  return <SummaryView trip={serializedTrip} />;
}