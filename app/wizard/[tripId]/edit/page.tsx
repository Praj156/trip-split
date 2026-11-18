import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { checkUser } from '@/lib/auth';
import { getOwnedTrip } from '@/lib/access';
import NewTripForm from '../../NewTripForm';
import { Steps, ui } from '@/app/components/ui';

export const metadata = { title: 'Edit trip' };

export default async function EditTripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const user = await checkUser();
  if (!user) notFound();

  const owned = await getOwnedTrip(tripId);
  if (!owned) notFound();
  if (owned.status !== 'active') redirect(`/wizard/${owned.id}/summary`);
  const members = await db.member.findMany({ where: { tripId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const trip = { ...owned, members };

  const initialData = {
    name: trip.name,
    startDate: trip.startDate ? trip.startDate.toISOString().split('T')[0] : '',
    endDate: trip.endDate ? trip.endDate.toISOString().split('T')[0] : '',
    currency: trip.currency,
    members: trip.members.map((m, i) => ({ id: i + 1, name: m.name })),
  };

  return (
    <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Steps current={1} />
      <h1 className={`${ui.pageTitle} mt-4`}>Edit trip</h1>
      <p className="text-sm text-ink-2 mt-1 mb-5">Change the details or members. Expenses are kept.</p>
      <NewTripForm defaultCurrency={user.defaultCurrency || 'AED'} tripId={tripId} initialData={initialData} />
    </div>
  );
}
