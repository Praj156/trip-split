'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTripStatus, deleteTrip } from '@/app/actions/trip';
import Link from 'next/link';
import { computeBalances, computeSettlements, effectiveSharers, formatMoney } from '@/lib/settlement';
import { Avatar, StatusBadge, ui } from '@/app/components/ui';
import { ConfirmDialog } from '@/app/components/ConfirmDialog';

interface SerializedExpense {
  id: string;
  description: string;
  amount: number;
  sharedWithIds: string[];
  date: string;
}

interface SerializedMember {
  id: string;
  name: string;
  expenses: SerializedExpense[];
}

interface SerializedTrip {
  id: string;
  name: string;
  status: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  members: SerializedMember[];
}

export default function SummaryView({
  trip,
  viewer = 'owner',
  editHref,
  footer,
  layout = 'page',
}: {
  trip: SerializedTrip;
  /** Members (via their link) get a read-only view. */
  viewer?: 'owner' | 'member';
  /** Where the "Edit expenses" button goes; hidden when omitted. */
  editHref?: string;
  /** Extra owner content shown with the actions (e.g. member links). */
  footer?: React.ReactNode;
  /** 'page' uses a sidebar on wide screens; 'embedded' is a single column. */
  layout?: 'page' | 'embedded';
}) {
  const isOwner = viewer === 'owner';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settlements' | 'ledger' | 'stats'>('settlements');
  const [copied, setCopied] = useState(false);
  const [dialog, setDialog] = useState<null | 'complete' | 'reopen' | 'delete'>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const isActive = trip.status === 'active';
  const cur = trip.currency;
  const money = (n: number) => formatMoney(n, cur);

  const changeStatus = async (status: 'active' | 'completed') => {
    setBusy(true);
    setActionError('');
    const res = await updateTripStatus(trip.id, status).catch(() => null);
    setBusy(false);
    setDialog(null);
    if (!res?.ok) setActionError(res?.error ?? 'Could not update the trip. Try again.');
    router.refresh();
  };

  const handleDeleteTrip = async () => {
    setBusy(true);
    const res = await deleteTrip(trip.id).catch(() => null);
    if (res?.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setBusy(false);
      setDialog(null);
      setActionError(res?.error ?? 'Could not delete the trip. Try again.');
    }
  };

  // Totals, balances and the transfers that settle them (see lib/settlement.ts)
  const totalTripExpense = trip.members.reduce((acc, m) => acc + m.expenses.reduce((sum, e) => sum + e.amount, 0), 0);
  const perMember = totalTripExpense / (trip.members.length || 1);
  const flatExpenses = trip.members.flatMap((m) =>
    m.expenses.map((e) => ({ amount: e.amount, paidById: m.id, sharedWithIds: e.sharedWithIds })),
  );
  const balances = computeBalances(trip.members, flatExpenses);
  const settlements = computeSettlements(trip.members, balances);
  const memberIds = new Set(trip.members.map((m) => m.id));

  const allExpenses = trip.members
    .flatMap((m) =>
      m.expenses.map((e) => ({
        id: e.id,
        description: e.description || '',
        amount: e.amount,
        paidBy: m.name,
        date: new Date(e.date),
        sharedWith: effectiveSharers({ amount: e.amount, paidById: m.id, sharedWithIds: e.sharedWithIds }, memberIds).map(
          (id) => trip.members.find((member) => member.id === id)?.name ?? 'Unknown',
        ),
      })),
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const dateLabel = trip.startDate
    ? trip.endDate && trip.endDate !== trip.startDate
      ? `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`
      : fmt(trip.startDate)
    : '';

  // Compact range for the trip card, e.g. "Sep 29 – Oct 1, 2026".
  const cardDate = (() => {
    if (!trip.startDate) return '';
    const s = new Date(trip.startDate);
    const e = trip.endDate ? new Date(trip.endDate) : s;
    const md = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const y = (d: Date) => d.getUTCFullYear();
    if (trip.endDate === trip.startDate || !trip.endDate) return fmt(trip.startDate);
    return y(s) === y(e) ? `${md(s)} – ${md(e)}, ${y(e)}` : `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`;
  })();

  const handleCopySummary = () => {
    // Original TripSplit WhatsApp format (emojis included).
    let report = `✈️ TRIP SPLIT SUMMARY: ${trip.name.toUpperCase()}\n`;
    if (trip.startDate && trip.endDate) {
      report += `📅 Date: ${fmt(trip.startDate)} - ${fmt(trip.endDate)}\n`;
    }
    report += `💰 Total Trip Expense: ${totalTripExpense.toFixed(2)} ${cur}\n`;
    report += `👥 Members: ${trip.members.length}\n`;
    report += `-------------------------------------------\n\n`;

    report += `📊 CONTRIBUTIONS:\n`;
    trip.members.forEach((m) => {
      const spent = m.expenses.reduce((sum, e) => sum + e.amount, 0);
      report += `  - ${m.name}: ${spent.toFixed(2)} ${cur}\n`;
    });
    report += `\n`;

    report += `💸 FINAL SETTLEMENTS (WHO PAYS WHOM):\n`;
    if (settlements.length > 0) {
      settlements.forEach((x) => {
        report += `  ✅ ${x.from} pays ${x.to} ➜ ${x.amount.toFixed(2)} ${cur}\n`;
      });
    } else {
      report += `  ✨ Everything is perfectly balanced! No payments needed.\n`;
    }
    report += `\nShared via TripSplit 🚀`;

    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(report).then(done, () => window.prompt('Copy the summary', report));
    } else {
      window.prompt('Copy the summary', report);
    }
  };

  const maxSpent = Math.max(...trip.members.map((m) => m.expenses.reduce((s, e) => s + e.amount, 0)), 1);

  const tabs = [
    ['settlements', 'Settle up'],
    ['ledger', `Expenses (${allExpenses.length})`],
    ['stats', 'Per member'],
  ] as const;

  const wide = layout === 'page';
  const memberCount = `${trip.members.length} ${trip.members.length === 1 ? 'member' : 'members'}`;

  const checkIcon = (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );

  /* Trip card: dates, status, totals and the owner's trip actions. */
  const tripCard = (
    <section
      aria-label="Trip details"
      className="rounded-[20px] bg-navy text-white px-4 py-4 sm:px-5 print:bg-white print:text-navy print:border print:border-line"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[#d7e2ec] print:text-ink-2">{cardDate || memberCount}</span>
        <StatusBadge status={isActive ? 'active' : 'completed'} onDark />
      </div>
      <p className="mt-3 text-[0.8125rem] text-[#bfe9e5] print:text-ink-2">Total spent</p>
      <p className="font-display text-[1.75rem] sm:text-[2rem] font-extrabold leading-[1.1] break-words">{money(totalTripExpense)}</p>
      <p className="mt-0.5 text-sm text-[#d7e2ec] print:text-ink-2">
        {money(perMember)} per member{dateLabel ? ` · ${memberCount}` : ''}
      </p>

      {isOwner && wide && (
        <div className={`no-print mt-4 flex gap-2 ${isActive ? 'lg:flex-col' : ''}`}>
          {isActive ? (
            <>
              <button
                type="button"
                onClick={() => setDialog('complete')}
                className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 h-11 lg:h-10 px-4 rounded-full bg-peach text-navy text-[0.9375rem] lg:text-sm font-bold hover:bg-sunset transition-colors"
              >
                {checkIcon}
                Mark trip as completed
              </button>
              {editHref && (
                <Link
                  href={editHref}
                  aria-label="Edit expenses"
                  className="inline-flex items-center justify-center h-11 lg:h-10 px-4 rounded-full border border-white/35 text-white text-[0.9375rem] lg:text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <span className="lg:hidden">Edit</span>
                  <span className="hidden lg:inline">Edit expenses</span>
                </Link>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setDialog('reopen')}
              className="flex-1 inline-flex items-center justify-center h-11 lg:h-10 px-4 rounded-full border border-white/35 text-white text-[0.9375rem] lg:text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Reopen trip
            </button>
          )}
        </div>
      )}
    </section>
  );

  return (
    <div className={`${wide ? 'max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-8' : ''} space-y-4 print:py-0`}>
      {wide ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-x-2.5 gap-y-0.5 min-w-0">
          {isOwner && (
            <>
              <Link href="/dashboard" className="no-print inline-flex items-center gap-1 text-sm font-semibold text-teal hover:text-teal-2 shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 3L4.5 7l4 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                My trips
              </Link>
              <span aria-hidden="true" className="no-print hidden sm:inline text-line-2">/</span>
            </>
          )}
          <h1 className="font-display text-[1.625rem] sm:text-[1.75rem] font-extrabold leading-tight tracking-[-0.01em] text-navy [overflow-wrap:anywhere]">
            {trip.name}
          </h1>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="hidden print:block font-display text-[1.75rem] font-extrabold text-navy">{trip.name}</p>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy">Group settlement</h2>
          {tripCard}
        </div>
      )}

      {!isActive && (
        <p className="no-print rounded-[20px] border border-line bg-white px-5 py-3.5 text-[0.9375rem] text-ink-2">
          <strong className="text-navy">This trip is completed.</strong> Expenses are locked and the settlement below is final.
        </p>
      )}

      {actionError && (
        <p role="alert" className="text-[0.9375rem] font-semibold text-danger bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          {actionError}
        </p>
      )}

      <div className={`grid gap-4 lg:gap-5 ${wide ? 'lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_1fr] lg:items-start' : ''}`}>
        {wide && <div className="lg:col-start-2 lg:row-start-1">{tripCard}</div>}
        <div className={`space-y-4 min-w-0 ${wide ? 'lg:col-start-1 lg:row-start-1 lg:row-span-2' : ''}`}>
          <div role="tablist" aria-label="Trip summary" className="no-print flex gap-1 p-1 rounded-full bg-white border border-line">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 h-10 px-2 rounded-full text-[0.9375rem] font-bold transition-colors ${
                  activeTab === key ? 'bg-peach text-navy' : 'text-ink-2 hover:text-navy'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* All three sections are always rendered; only the active one shows on screen,
              and printing includes every section so the PDF is the full trip record. */}
          <div className={activeTab === 'settlements' ? 'print:break-inside-avoid' : 'hidden print:block print:break-inside-avoid'}>
            <h2 className="hidden print:block font-display text-lg font-bold text-navy mb-2">Who pays whom</h2>
            <section className={`${ui.card} overflow-hidden`} aria-label="Payments to settle up">
              {settlements.length > 0 ? (
                <ul className="divide-y divide-line">
                  {settlements.map((x, i) => (
                    <li key={i} className="px-3 sm:px-6 py-4">
                      <div className={`grid items-center gap-2 ${wide ? 'grid-cols-[minmax(0,1fr)_5.75rem_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_11rem_minmax(0,1fr)] sm:gap-5' : 'grid-cols-[minmax(0,1fr)_5.75rem_minmax(0,1fr)]'}`}>
                        <div className="flex items-center justify-end gap-3 min-w-0 text-right">
                          <span className={`font-semibold text-navy text-[0.9375rem] [overflow-wrap:anywhere] min-w-0 ${wide ? 'sm:text-lg' : ''}`}>{x.from}</span>
                          {wide && <span className="hidden sm:inline-flex"><Avatar name={x.from} tone="sunset" size="lg" /></span>}
                        </div>
                        <div className="flex flex-col items-center">
                          <span className={`font-display font-bold text-navy whitespace-nowrap text-[0.9375rem] ${wide ? 'sm:text-xl' : ''}`}>
                            {formatMoney(x.amount)}
                            {wide && <span className="hidden sm:inline"> {cur}</span>}
                          </span>
                          <span aria-hidden="true" className="flex items-center w-full text-teal my-0.5">
                            <span className="h-0.5 flex-1 bg-current rounded-full" />
                            <svg width="12" height="12" viewBox="0 0 12 12" className="-ml-1"><path d="M2 1.5l5 4.5-5 4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </span>
                          <span className="sr-only">{`${x.from} pays ${x.to}`}</span>
                          <span aria-hidden="true" className="text-xs sm:text-sm text-ink-2">
                            <span className={wide ? 'sm:hidden' : ''}>{cur}</span>
                            {wide && <span className="hidden sm:inline">pays</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 min-w-0">
                          {wide && <span className="hidden sm:inline-flex"><Avatar name={x.to} tone="teal" size="lg" /></span>}
                          <span className={`font-semibold text-navy text-[0.9375rem] [overflow-wrap:anywhere] min-w-0 ${wide ? 'sm:text-lg' : ''}`}>{x.to}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="font-display text-lg font-bold text-navy">Everyone is already even.</p>
                  <p className="text-[0.9375rem] text-ink-2 mt-1">
                    {allExpenses.length ? 'No payments are needed.' : 'Add expenses to see who owes whom.'}
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className={activeTab === 'ledger' ? 'print:mt-6' : 'hidden print:block print:mt-6'}>
            <h2 className="hidden print:block font-display text-lg font-bold text-navy mb-2">All expenses ({allExpenses.length})</h2>
            <section className={`${ui.card} overflow-hidden`} aria-label="All expenses">
              {allExpenses.length > 0 ? (
                <ul className="divide-y divide-line">
                  {allExpenses.map((exp) => (
                    <li key={exp.id} className="px-4 sm:px-6 py-3.5 flex items-start justify-between gap-4 break-inside-avoid">
                      <div className="min-w-0">
                        <p className="text-navy text-[0.9375rem] sm:text-base break-words">
                          {exp.description ? (
                            <>
                              <span className="font-semibold">{exp.description}</span>
                              <span className="text-ink-2">, paid by {exp.paidBy}</span>
                            </>
                          ) : (
                            <span className="font-semibold">Paid by {exp.paidBy}</span>
                          )}
                        </p>
                        <p className="text-sm text-ink-2 mt-0.5 break-words">
                          <span suppressHydrationWarning>
                            {exp.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </span>
                          {`, shared by ${exp.sharedWith.length === trip.members.length && trip.members.length > 1 ? 'all members' : exp.sharedWith.join(', ')}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-bold text-navy whitespace-nowrap text-[1.0625rem]">{money(exp.amount)}</p>
                        {exp.sharedWith.length > 1 && (
                          <p className="text-sm text-ink-2 whitespace-nowrap">{formatMoney(exp.amount / exp.sharedWith.length)} each</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-10 text-center text-[0.9375rem] text-ink-2">No expenses yet.</p>
              )}
            </section>
          </div>

          <div className={activeTab === 'stats' ? 'print:mt-6 print:break-inside-avoid' : 'hidden print:block print:mt-6 print:break-inside-avoid'}>
            <h2 className="hidden print:block font-display text-lg font-bold text-navy mb-2">Per member</h2>
            <section className={`${ui.card} overflow-hidden`} aria-label="Per member">
              <ul className="divide-y divide-line">
                {trip.members.map((m) => {
                  const spent = m.expenses.reduce((sum, e) => sum + e.amount, 0);
                  const balance = balances[m.id] ?? 0;
                  const share = spent - balance;
                  const even = Math.abs(balance) < 0.005;
                  return (
                    <li key={m.id} className="px-4 sm:px-6 py-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={m.name} size="sm" />
                          <span className="font-semibold text-navy truncate">{m.name}</span>
                        </div>
                        <span
                          className={`text-sm font-bold whitespace-nowrap px-3 py-1 rounded-full ${
                            even ? 'bg-sky text-ink-2' : balance > 0 ? 'bg-teal-soft text-teal-2' : 'bg-sunset-soft text-sunset-ink'
                          }`}
                        >
                          {even ? 'Even' : balance > 0 ? `Gets back ${money(balance)}` : `Owes ${money(-balance)}`}
                        </span>
                      </div>
                      <div className="mt-2.5 h-2 rounded-full bg-sky overflow-hidden" aria-hidden="true">
                        <div className="h-full rounded-full bg-teal-mid" style={{ width: `${(spent / maxSpent) * 100}%` }} />
                      </div>
                      <p className="mt-1.5 text-sm text-ink-2">
                        Paid {money(spent)}, share of costs {money(share)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          {footer && <div className="no-print">{footer}</div>}
        </div>

        {/* Share and other actions */}
        <aside className={`no-print ${wide ? 'lg:col-start-2 lg:row-start-2' : ''}`}>
          <div className={`${ui.card} p-4 flex flex-col gap-2.5 ${wide ? '' : 'sm:flex-row sm:flex-wrap'}`}>
            {wide && <p className="font-display font-bold text-navy px-1">Share the result</p>}
            <button type="button" onClick={handleCopySummary} className={`${ui.btnPrimary} ${copied ? 'bg-teal-2' : ''}`}>
              {copied ? 'Summary copied' : 'Copy summary for WhatsApp'}
            </button>
            <button type="button" onClick={() => window.print()} className={ui.btnSecondary}>
              Print or save PDF
            </button>
            {isOwner && (
              <button type="button" onClick={() => setDialog('delete')} className={ui.btnDangerGhost}>
                Delete trip
              </button>
            )}
          </div>
        </aside>
      </div>

      {isOwner && (
        <>
          <ConfirmDialog
            open={dialog === 'complete'}
            title="Mark this trip as completed?"
            confirmLabel="Mark as completed"
            cancelLabel="Not yet"
            busy={busy}
            onCancel={() => setDialog(null)}
            onConfirm={() => changeStatus('completed')}
          >
            <p>
              Once it&apos;s completed, <strong>no one can add or edit expenses</strong> on this trip, including members
              using their links.
            </p>
            <p>The trip stays available for viewing the final settlement, and moves to your Completed trips.</p>
          </ConfirmDialog>
          <ConfirmDialog
            open={dialog === 'reopen'}
            title="Reopen this trip?"
            confirmLabel="Reopen trip"
            busy={busy}
            onCancel={() => setDialog(null)}
            onConfirm={() => changeStatus('active')}
          >
            <p>Expenses become editable again, by you and by members with a link. The settlement may change.</p>
          </ConfirmDialog>
          <ConfirmDialog
            open={dialog === 'delete'}
            title="Delete this trip?"
            confirmLabel="Delete trip"
            tone="danger"
            busy={busy}
            onCancel={() => setDialog(null)}
            onConfirm={handleDeleteTrip}
          >
            <p>
              <strong>{trip.name}</strong> and all its expenses will be permanently deleted, and every member link will
              stop working. This can&apos;t be undone.
            </p>
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}
