'use client';

import { useState } from 'react';
import Link from 'next/link';

type Trip = any; // We can use the Prisma types, but this is fine for now

export default function DashboardClient({ trips }: { trips: Trip[] }) {
  const [tab, setTab] = useState<'active' | 'past'>('active');

  const activeTrips = trips.filter((t) => t.status === 'active');
  // Treat legacy 'settled' status as 'completed' so past trips remain visible
  const pastTrips = trips.filter((t) => t.status === 'completed' || t.status === 'settled');

  const displayedTrips = tab === 'active' ? activeTrips : pastTrips;

  return (
    <div className="space-y-6">
      {/* ── Trips Header & Tabs ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">My Trips</h2>
          <div className="flex gap-4 mt-2">
            <button
              onClick={() => setTab('active')}
              className={`text-sm font-bold pb-1 border-b-2 transition-all ${
                tab === 'active' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Active ({activeTrips.length})
            </button>
            <button
              onClick={() => setTab('past')}
              className={`text-sm font-bold pb-1 border-b-2 transition-all ${
                tab === 'past' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Past / Completed ({pastTrips.length})
            </button>
          </div>
        </div>
        <Link
          href="/wizard"
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <span className="text-base leading-none">+</span>
          Plan New Trip
        </Link>
      </div>

      {/* ── Trips Grid / List ──────────────────────────────────── */}
      {displayedTrips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTrips.map((trip) => {
            const start = trip.startDate ? new Date(trip.startDate) : new Date();
            const end = trip.endDate ? new Date(trip.endDate) : new Date();
            const nights = trip.startDate && trip.endDate
              ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            const duration = nights === 0 ? '1 day' : `${nights + 1} days`;
            const dateStr = trip.startDate
              ? start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'N/A';

            // Calculate total trip spending
            const totalTripSpent = trip.members.reduce((mSum: number, m: any) => {
              return mSum + m.expenses.reduce((eSum: number, e: any) => eSum + e.amount, 0);
            }, 0);

            return (
              <Link
                key={trip.id}
                href={`/wizard/${trip.id}/summary`}
                className="group relative bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between h-[210px] overflow-hidden"
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-full h-1.5 transition-opacity ${
                  trip.status === 'active' 
                    ? 'bg-linear-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100'
                    : 'bg-slate-300 opacity-100'
                }`} />

                <div>
                  {/* Card top */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg border group-hover:scale-105 transition-transform ${
                      trip.status === 'active' ? 'bg-linear-to-tr from-indigo-50 to-blue-50 border-indigo-100/50' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {trip.status === 'active' ? '🌴' : '✅'}
                    </div>
                    <div className="flex gap-1.5">
                      {trip.status !== 'active' && (
                         <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                           {trip.status}
                         </span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100/20">
                        {duration}
                      </span>
                    </div>
                  </div>

                  {/* Trip name */}
                  <h3 className={`font-black text-lg mb-1 transition-colors leading-tight ${
                    trip.status === 'active' ? 'text-slate-800 group-hover:text-indigo-600' : 'text-slate-600'
                  }`}>
                    {trip.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{dateStr}</p>
                </div>

                {/* Card bottom */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between mt-auto">
                  {/* Members Avatars */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5">
                      {trip.members.slice(0, 3).map((m: any) => (
                        <div key={m.id}
                          className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black shadow-sm uppercase ${
                            trip.status === 'active' ? 'bg-linear-to-br from-indigo-500 to-blue-600 text-white' : 'bg-slate-300 text-slate-600'
                          }`}>
                          {m.name.charAt(0)}
                        </div>
                      ))}
                      {trip._count?.members > 3 && (
                        <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-500 shadow-sm">
                          +{trip._count.members - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {trip._count?.members || trip.members.length} family{trip._count?.members !== 1 ? 'ies' : ''}
                    </span>
                  </div>

                  {/* Cost Badge */}
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Cost</span>
                    <span className={`text-sm font-black transition-colors ${
                      trip.status === 'active' ? 'text-slate-900 group-hover:text-indigo-600' : 'text-slate-500'
                    }`}>
                      {totalTripSpent.toLocaleString('en-US', { maximumFractionDigits: 0 })} {trip.currency || 'AED'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* ── Empty State ─────────────────────────────────────── */
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200/80 p-12 text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl mx-auto bg-linear-to-tr from-indigo-50 to-blue-50 border border-indigo-100/50 shadow-sm animate-bounce duration-1000">
            🧭
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-slate-900 text-lg">
              {tab === 'active' ? 'No active trips' : 'No past trips'}
            </h3>
            <p className="text-slate-500 text-sm font-medium max-w-sm mx-auto leading-relaxed">
              {tab === 'active' 
                ? 'Create your first shared trip, add your families, input expenses, and calculate who owes what in seconds.'
                : 'Trips you mark as completed will appear here.'}
            </p>
          </div>
          {tab === 'active' && (
            <Link
              href="/wizard"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:shadow-lg shadow-indigo-100 transition-all cursor-pointer"
            >
              <span className="text-base leading-none">+</span>
              Create Your First Trip
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
