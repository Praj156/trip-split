import { redirect } from 'next/navigation';
import Link from 'next/link';
import { checkUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ui } from '@/app/components/ui';
import DashboardClient from './DashboardClient';

export const metadata = { title: 'My trips' };

export default async function DashboardPage() {
  const user = await checkUser();
  if (!user) redirect('/sign-in');

  const trips = await db.trip.findMany({
    where: { userId: user.id },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    include: {
      members: { select: { id: true, name: true, expenses: { select: { amount: true } } } },
    },
  });

  const firstName = user.name?.split(' ')[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={ui.pageTitle}>{firstName ? `Hi ${firstName}` : 'Your trips'}</h1>
          <p className="text-[0.9375rem] text-ink-2 mt-1.5">
            {trips.length === 0
              ? 'Create a trip, add who’s going, and send everyone their link.'
              : 'Open a trip to add expenses or see who owes whom.'}
          </p>
        </div>
        <Link href="/wizard" className={ui.btnDark}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          New trip
        </Link>
      </div>

      <DashboardClient
        trips={trips.map((t) => ({
          id: t.id,
          name: t.name,
          status: t.status,
          currency: t.currency,
          startDate: t.startDate?.toISOString() ?? null,
          endDate: t.endDate?.toISOString() ?? null,
          members: t.members.map((m) => ({ id: m.id, name: m.name })),
          total: t.members.reduce((s, m) => s + m.expenses.reduce((x, e) => x + e.amount, 0), 0),
          expenseCount: t.members.reduce((s, m) => s + m.expenses.length, 0),
        }))}
      />
    </div>
  );
}
