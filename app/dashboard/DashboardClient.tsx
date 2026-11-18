'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Avatar, StatusBadge, ui } from '@/app/components/ui';

export interface DashboardTrip {
  id: string;
  name: string;
  status: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  members: { id: string; name: string }[];
  total: number;
  expenseCount: number;
}

const fmtDate = (iso: string, withYear = true) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });

function dateRange(start: string | null, end: string | null) {
  if (!start) return 'No dates';
  if (!end || end === start) return fmtDate(start);
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${fmtDate(start, !sameYear)} – ${fmtDate(end)}`;
}

// Each trip gets a cover colour, picked from its id so it never changes.
const COVERS = [
  { bg: 'bg-navy', text: 'text-white', sub: 'text-[#d7e2ec]' },
  { bg: 'bg-teal', text: 'text-white', sub: 'text-[#d4f1ee]' },
  { bg: 'bg-sunset', text: 'text-navy', sub: 'text-navy/80' },
  { bg: 'bg-peach', text: 'text-navy', sub: 'text-navy/80' },
];
const coverFor = (id: string) => COVERS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % COVERS.length];

export default function DashboardClient({ trips }: { trips: DashboardTrip[] }) {
  const isDone = (t: DashboardTrip) => t.status === 'completed' || t.status === 'settled';
  const active = trips.filter((t) => !isDone(t));
  const past = trips.filter(isDone);
  const [tab, setTab] = useState<'active' | 'past'>(active.length === 0 && past.length > 0 ? 'past' : 'active');
  const shown = tab === 'active' ? active : past;

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Trips" className="inline-flex gap-1 p-1 rounded-full bg-white border border-line">
        {(
          [
            ['active', `Active (${active.length})`],
            ['past', `Completed (${past.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`h-9 px-4 rounded-full text-sm font-bold transition-colors ${
              tab === key ? 'bg-peach text-navy' : 'text-ink-2 hover:text-navy'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((trip) => {
            const cover = coverFor(trip.id);
            const done = isDone(trip);
            return (
              <li key={trip.id}>
                <Link
                  href={`/wizard/${trip.id}/summary`}
                  className="group block h-full rounded-[20px] bg-white border border-line overflow-hidden hover:shadow-[0_16px_32px_-20px_rgba(19,50,74,0.45)] hover:-translate-y-0.5 transition-[box-shadow,transform]"
                >
                  <div className={`${done ? 'bg-[#e9eef4] text-navy' : `${cover.bg} ${cover.text}`} px-5 pt-4 pb-5 relative`}>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-xl font-bold leading-tight break-words">{trip.name}</h2>
                      {done && <StatusBadge status="completed" />}
                    </div>
                    <p className={`text-sm mt-1 ${done ? 'text-ink-2' : cover.sub}`}>{dateRange(trip.startDate, trip.endDate)}</p>
                    {/* the road: a dashed line ending in a stop */}
                    <svg aria-hidden="true" viewBox="0 0 300 16" preserveAspectRatio="none" className="absolute left-0 right-0 -bottom-px w-full h-4 opacity-60">
                      <path d="M0 12 C 60 2, 120 16, 180 8 S 270 4, 300 10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 6" fill="none" />
                    </svg>
                  </div>
                  <div className="px-5 py-4 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex -space-x-2">
                        {trip.members.slice(0, 5).map((m) => (
                          <span key={m.id} className="rounded-full ring-2 ring-white">
                            <Avatar name={m.name} size="sm" />
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-ink-2 mt-1.5">
                        {trip.members.length} {trip.members.length === 1 ? 'member' : 'members'}, {trip.expenseCount}{' '}
                        {trip.expenseCount === 1 ? 'expense' : 'expenses'}
                      </p>
                    </div>
                    <p className="font-display text-xl font-bold text-navy whitespace-nowrap">
                      {trip.total.toLocaleString('en-US', { maximumFractionDigits: 0 })}{' '}
                      <span className="text-sm font-semibold text-ink-2">{trip.currency}</span>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={`${ui.card} px-6 py-10 text-center`}>
          <svg aria-hidden="true" viewBox="0 0 200 40" className="w-48 h-10 mx-auto text-line-2">
            <path d="M5 30 C 50 5, 80 38, 120 20 S 175 8, 195 18" stroke="currentColor" strokeWidth="3" strokeDasharray="7 8" fill="none" strokeLinecap="round" />
            <circle cx="5" cy="30" r="5" fill="#7fd6cf" />
            <circle cx="195" cy="18" r="5" fill="#ff9b5c" />
          </svg>
          <h2 className="font-display text-xl font-bold text-navy mt-3">{tab === 'active' ? 'No active trips' : 'No completed trips yet'}</h2>
          <p className="text-[0.9375rem] text-ink-2 mt-1 max-w-sm mx-auto">
            {tab === 'active'
              ? 'Start a trip, add the members, and log what everyone paid. TripSplit works out who owes whom.'
              : 'When everyone has paid up, mark a trip as completed and it moves here.'}
          </p>
          {tab === 'active' && (
            <Link href="/wizard" className={`${ui.btnPrimary} mt-5`}>
              Create your first trip
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
