import { checkUser } from '../actions/user';
import { db } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) redirect('/sign-in');

  const trips = await db.trip.findMany({
    where: { userId: user.id },
    orderBy: { startDate: 'desc' },
    include: {
      members: true,
      _count: { select: { members: true } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* ── Page Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Trips</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            {trips.length === 0
              ? 'No trips yet — create your first one!'
              : `${trips.length} trip${trips.length === 1 ? '' : 's'} total`}
          </p>
        </div>
        <Link
          href="/wizard"
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-200 hover:-translate-y-0.5"
        >
          <span className="text-lg leading-none">+</span>
          New Trip
        </Link>
      </div>

      {/* ── Trips Grid ────────────────────────────────────────── */}
      {trips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map(trip => {
            const start = new Date(trip.startDate);
            const end = new Date(trip.endDate);
            const nights = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const duration = nights === 0 ? '1 day' : `${nights + 1} days`;
            const dateStr = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            return (
              <Link
                key={trip.id}
                href={`/wizard/${trip.id}/summary`}
                className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
              >
                {/* Card top */}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                    style={{ background: 'linear-gradient(135deg, #dbeafe, #e0f2fe)' }}>
                    ✈️
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    {duration}
                  </span>
                </div>

                {/* Trip name */}
                <h3 className="font-black text-slate-900 text-base mb-1 group-hover:text-blue-600 transition-colors">
                  {trip.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-3">{dateStr}</p>

                {/* Members */}
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1">
                    {trip.members.slice(0, 4).map(m => (
                      <div key={m.id}
                        className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-blue-600">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {trip._count.members > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-500">
                        +{trip._count.members - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {trip._count.members} member{trip._count.members !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ─────────────────────────────────────── */
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #dbeafe, #e0f2fe)' }}>
            🗺️
          </div>
          <h3 className="font-black text-slate-900 text-base mb-2">No trips yet</h3>
          <p className="text-slate-500 text-sm font-medium mb-6 max-w-xs mx-auto">
            Create your first trip to start tracking group expenses and calculating who owes what.
          </p>
          <Link
            href="/wizard"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            <span className="text-base leading-none">+</span>
            Create your first trip
          </Link>
        </div>
      )}
    </div>
  );
}
