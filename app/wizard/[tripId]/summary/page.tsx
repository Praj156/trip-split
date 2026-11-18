import { notFound } from 'next/navigation';
import { getOwnedTrip } from '@/lib/access';
import { loadSerializedTrip } from '@/lib/trip-data';
import SharePanel from '@/app/components/SharePanel';
import SummaryView from './SummaryView';

export const metadata = { title: 'Settlement' };

export default async function SummaryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!(await getOwnedTrip(tripId))) notFound();

  const trip = await loadSerializedTrip(tripId);
  if (!trip) notFound();

  return (
    <SummaryView
      trip={trip}
      viewer="owner"
      editHref={`/wizard/${trip.id}/sharing`}
      footer={
        trip.status === 'active' ? (
          <SharePanel
            tripId={trip.id}
            tripName={trip.name}
            currency={trip.currency}
            stats={Object.fromEntries(
              trip.members.map((m) => [
                m.id,
                { count: m.expenses.length, total: m.expenses.reduce((t, e) => t + e.amount, 0) },
              ]),
            )}
          />
        ) : undefined
      }
    />
  );
}
