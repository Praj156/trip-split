import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getOwnedTrip } from '@/lib/access';
import ExpenseEditor from '@/app/components/ExpenseEditor';
import SharePanel from '@/app/components/SharePanel';
import { Steps, ui } from '@/app/components/ui';

export const metadata = { title: 'Expenses' };

export default async function SharingPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const trip = await getOwnedTrip(tripId);
  if (!trip) notFound();
  if (trip.status !== 'active') redirect(`/wizard/${trip.id}/summary`);

  const members = await db.member.findMany({
    where: { tripId },
    orderBy: { name: 'asc' },
    include: { expenses: { orderBy: { createdAt: 'asc' } } },
  });
  if (members.length === 0) notFound();

  return (
    <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <Steps current={2} />
        <h1 className={`${ui.pageTitle} mt-4 break-words`}>{trip.name}</h1>
        <p className="text-sm text-ink-2 mt-1 max-w-prose">
          Add each expense once: who paid, how much, and which members shared it. Every expense saves as you add it.
        </p>
      </div>

      {trip.status === 'active' && (
        <SharePanel
          tripId={trip.id}
          tripName={trip.name}
          currency={trip.currency}
          stats={Object.fromEntries(
            members.map((m) => [m.id, { count: m.expenses.length, total: m.expenses.reduce((t, e) => t + e.amount, 0) }]),
          )}
        />
      )}

      <ExpenseEditor
        mode={{ kind: 'owner', tripId: trip.id }}
        currency={trip.currency}
        members={members.map((m) => ({ id: m.id, name: m.name }))}
        expenses={members.flatMap((m) =>
          m.expenses.map((e) => ({
            id: e.id,
            paidById: m.id,
            amount: e.amount,
            description: e.description,
            sharedWithIds: e.sharedWithIds,
            createdAt: e.createdAt.toISOString(),
          })),
        )}
        doneHref={`/wizard/${trip.id}/summary`}
        backHref={`/wizard/${trip.id}/edit`}
      />
    </div>
  );
}
