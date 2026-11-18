import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMemberByToken } from '@/lib/access';
import { loadSerializedTrip } from '@/lib/trip-data';
import { Logo } from '@/app/components/Logo';
import ExpenseEditor from '@/app/components/ExpenseEditor';
import SummaryView from '@/app/wizard/[tripId]/summary/SummaryView';

// Personal links must never be indexed or leak through the Referer header.
export const metadata: Metadata = {
  title: 'Your trip expenses',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function MemberPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const member = await getMemberByToken(token);
  if (!member) notFound();

  const trip = await loadSerializedTrip(member.tripId);
  if (!trip) notFound();

  const me = trip.members.find((m) => m.id === member.id)!;
  const active = trip.status === 'active';

  return (
    <div className="min-h-screen flex flex-col bg-sky">
      <header className="no-print bg-white border-b border-line">
        <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Logo size="sm" />
          <a href="#summary" className="lg:hidden h-10 inline-flex items-center px-4 rounded-full bg-sky border border-line text-sm font-bold text-navy">See settlement</a>
        </div>
      </header>

      <main className="grow">
        <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-8 grid gap-8 lg:grid-cols-2 lg:gap-8 items-start">
          <div className="space-y-4 min-w-0 no-print">
            <div className="relative overflow-hidden rounded-[24px] bg-navy text-white px-5 sm:px-7 py-6">
              <p className="text-[0.9375rem] text-[#bfe9e5] break-words">{trip.name}</p>
              <h1 className="font-display text-[1.875rem] sm:text-[2.25rem] font-extrabold leading-tight break-words">Hi {me.name}</h1>
              <p className="text-[0.9375rem] text-[#d7e2ec] mt-1.5 max-w-prose">
                {active
                  ? 'Add everything you paid for and choose which members shared each cost. Others add theirs, and the settlement updates for the whole group.'
                  : 'This trip is completed, so expenses are locked. The final settlement is shown here.'}
              </p>
            </div>

            <ExpenseEditor
              mode={{ kind: 'member', token }}
              currency={trip.currency}
              readOnly={!active}
              members={trip.members.map((m) => ({ id: m.id, name: m.name }))}
              fixedPayer={{ id: me.id, name: me.name }}
              expenses={me.expenses.map((e) => ({
                id: e.id,
                paidById: me.id,
                amount: e.amount,
                description: e.description,
                sharedWithIds: e.sharedWithIds,
                createdAt: e.createdAt,
              }))}
            />
          </div>

          <div id="summary" className="scroll-mt-4 min-w-0 border-t border-line pt-6 lg:border-0 lg:pt-0">
            <SummaryView trip={trip} viewer="member" layout="embedded" />
          </div>
        </div>
      </main>
    </div>
  );
}
