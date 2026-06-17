import { checkUser } from '../actions/user';
import { db } from '@/lib/db';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) redirect('/sign-in');

  const trips = await db.trip.findMany({
    where: { userId: user.id },
    orderBy: { startDate: 'desc' },
    include: {
      members: {
        include: {
          expenses: {
            select: { amount: true }
          }
        }
      },
      _count: { select: { members: true } },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">

      {/* ── Welcome Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-30%] left-[-10%] w-[300px] h-[300px] bg-teal-400/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ✈️ Expense Dashboard
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Hey, welcome back!
            </h1>
            <p className="text-sm text-slate-300 font-medium max-w-md">
              Keep your group expenses fair, transparent, and easy to settle. Let's start splitting.
            </p>
          </div>

          <div className="flex gap-4 md:gap-8 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 p-5 rounded-2xl">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Trips</p>
              <p className="text-3xl font-black text-white mt-0.5">{trips.length}</p>
            </div>
          </div>
        </div>
      </div>

      <DashboardClient trips={trips} />
    </div>
  );
}
