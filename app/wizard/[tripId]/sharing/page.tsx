import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import SharingForm from './SharingForm';

export default async function SharingPage({ 
  params 
}: { 
  params: Promise<{ tripId: string }> 
}) {
  const { tripId } = await params;

  // Fetch trip with members
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: { 
      members: {
        orderBy: { name: 'asc' }
      }
    },
  });

  if (!trip) notFound();
  if (trip.members.length === 0) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-[10px] font-black flex items-center justify-center">✓</span>
            <div className="w-8 h-0.5 bg-blue-600 rounded" />
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
            <div className="w-8 h-0.5 bg-slate-200 rounded" />
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-[10px] font-black flex items-center justify-center">3</span>
          </div>
        </div>
        <h1 className="text-xl font-black text-slate-900 mt-3">{trip.name}</h1>
        <p className="text-sm text-slate-500">Add expenses and choose who shares the cost.</p>
      </div>

      <SharingForm tripId={tripId} members={trip.members} />
    </div>
  );
}
