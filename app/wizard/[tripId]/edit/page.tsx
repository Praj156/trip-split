import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { checkUser } from '../../../actions/user';
import NewTripForm from '../../NewTripForm';

export default async function EditTripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const user = await checkUser();
  if (!user) notFound();

  const trip = await db.trip.findUnique({
    where: { id: tripId, userId: user.id },
    include: { members: true },
  });

  if (!trip) notFound();

  const initialData = {
    name: trip.name,
    startDate: trip.startDate ? trip.startDate.toISOString().split('T')[0] : '',
    endDate: trip.endDate ? trip.endDate.toISOString().split('T')[0] : '',
    currency: trip.currency,
    members: trip.members.map((m, i) => ({ id: i + 1, name: m.name })),
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
            <div className="w-8 h-0.5 bg-slate-200 rounded" />
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-[10px] font-black flex items-center justify-center">2</span>
            <div className="w-8 h-0.5 bg-slate-200 rounded" />
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-[10px] font-black flex items-center justify-center">3</span>
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-4">Edit Trip</h1>
        <p className="text-sm text-slate-500">Update trip details and members.</p>
      </div>

      <NewTripForm
        defaultCurrency={user.defaultCurrency || 'AED'}
        tripId={tripId}
        initialData={initialData}
      />
    </div>
  );
}
