'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { addExpense, deleteExpense, updateExpense, type EditorMode, type SavedExpense } from '@/app/actions/sharing';
import { formatMoney } from '@/lib/settlement';
import { LIMITS } from '@/lib/validation';
import { Avatar, ui } from './ui';
import { ConfirmDialog } from './ConfirmDialog';

export interface EditorMember {
  id: string;
  name: string;
}

interface Form {
  paidById: string;
  amount: string;
  description: string;
  sharedWithIds: string[];
}

/** What's wrong with an amount as typed, if anything. */
function amountProblem(raw: string): string | null {
  const v = raw.trim();
  if (v === '') return 'Enter the amount.';
  if (v.startsWith('-')) return 'Amount can’t be negative.';
  if (/^\d+\.\d{3,}$/.test(v)) return 'Use at most 2 decimal places.';
  if (!/^\d+(\.\d{0,2})?$/.test(v)) return 'Enter a number, like 120 or 45.50.';
  const n = Number(v);
  if (n <= 0) return 'Enter an amount greater than 0.';
  if (n > LIMITS.maxAmount) return 'That amount is too large.';
  return null;
}

/**
 * One "add expense" form with the trip's expenses in a table underneath.
 * Every add, edit and delete is saved straight away.
 */
export default function ExpenseEditor({
  mode,
  members,
  expenses,
  currency,
  readOnly = false,
  fixedPayer,
  doneHref,
  backHref,
}: {
  mode: EditorMode;
  members: EditorMember[];
  expenses: SavedExpense[];
  currency: string;
  readOnly?: boolean;
  /** Member link page: expenses are always paid by this member. */
  fixedPayer?: EditorMember;
  /** Owner: where "See settlement" goes. */
  doneHref?: string;
  /** Owner: where "Back to trip details" goes. */
  backHref?: string;
}) {
  const router = useRouter();
  const allIds = useMemo(() => members.map((m) => m.id), [members]);
  const nameOf = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, m.name]));
    return (id: string) => map.get(id) ?? 'Removed member';
  }, [members]);

  const blank = (paidById: string): Form => ({ paidById, amount: '', description: '', sharedWithIds: allIds });

  // Local copy of the list so changes show instantly; reset when the server sends new data.
  const [items, setItems] = useState(expenses);
  const [prevExpenses, setPrevExpenses] = useState(expenses);
  if (prevExpenses !== expenses) {
    setPrevExpenses(expenses);
    setItems(expenses);
  }

  const [form, setForm] = useState<Form>(() => blank(fixedPayer?.id ?? ''));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedExpense | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const problems = {
    paidBy: form.paidById ? '' : 'Choose who paid.',
    amount: amountProblem(form.amount) ?? '',
    shared: form.sharedWithIds.length ? '' : 'Pick at least one member to share this.',
  };
  const hasProblem = !!(problems.paidBy || problems.amount || problems.shared);
  const amountNum = Number(form.amount);

  const toggleSharer = (id: string) =>
    setForm((f) => ({
      ...f,
      sharedWithIds: f.sharedWithIds.includes(id) ? f.sharedWithIds.filter((x) => x !== id) : [...f.sharedWithIds, id],
    }));

  const startEdit = (e: SavedExpense) => {
    setEditingId(e.id);
    setForm({ paidById: e.paidById, amount: String(e.amount), description: e.description, sharedWithIds: e.sharedWithIds.filter((id) => allIds.includes(id)) });
    setTouched(false);
    setError('');
    setFlash('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => amountRef.current?.focus(), 50);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blank(form.paidById));
    setTouched(false);
    setError('');
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setTouched(true);
    setFlash('');
    if (hasProblem || busy) return;
    setBusy(true);
    setError('');
    const input = { paidById: form.paidById, amount: amountNum, description: form.description, sharedWithIds: form.sharedWithIds };
    try {
      const res = editingId ? await updateExpense(mode, editingId, input) : await addExpense(mode, input);
      if (!res.ok) {
        setError(res.error);
      } else {
        const saved = res.data;
        setItems((prev) => (editingId ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]));
        setFlash(editingId ? 'Expense updated.' : `Added ${formatMoney(saved.amount, currency)}${saved.description ? ` for ${saved.description}` : ''}.`);
        setEditingId(null);
        setForm(blank(form.paidById)); // keep "Paid by" for the next receipt
        setTouched(false);
        amountRef.current?.focus();
        router.refresh();
      }
    } catch {
      setError('Could not save. Check your connection and try again.');
    }
    setBusy(false);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusy(true);
    const target = pendingDelete;
    const res = await deleteExpense(mode, target.id).catch(() => null);
    setBusy(false);
    setPendingDelete(null);
    if (res?.ok) {
      setItems((prev) => prev.filter((x) => x.id !== target.id));
      if (editingId === target.id) cancelEdit();
      setFlash('Expense deleted.');
      router.refresh();
    } else {
      setError(res?.error ?? 'Could not delete. Try again.');
    }
  };

  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const shown = filter ? sorted.filter((e) => e.paidById === filter) : sorted;
  const total = shown.reduce((s, e) => s + e.amount, 0);
  const perPayer = members
    .map((m) => ({ ...m, total: items.filter((e) => e.paidById === m.id).reduce((s, e) => s + e.amount, 0) }))
    .filter((m) => m.total > 0);

  const sharedLabel = (e: SavedExpense) => {
    const valid = e.sharedWithIds.filter((id) => allIds.includes(id));
    if (valid.length === allIds.length && allIds.length > 1) return 'All members';
    if (valid.length === 0) return nameOf(e.paidById);
    return valid.map(nameOf).join(', ');
  };
  const eachOf = (e: SavedExpense) => {
    const n = e.sharedWithIds.filter((id) => allIds.includes(id)).length || 1;
    return e.amount / n;
  };

  const show = (field: keyof typeof problems) => (touched ? problems[field] : '');

  return (
    <div className="space-y-5">
      {!readOnly && (
        <form onSubmit={submit} noValidate className={`${ui.card} p-4 sm:p-6 ${editingId ? 'ring-2 ring-peach' : ''}`} aria-labelledby="expense-form-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="expense-form-title" className={ui.sectionTitle}>
              {editingId ? 'Edit expense' : 'Add an expense'}
            </h2>
            {fixedPayer && <span className="text-sm text-ink-2">Paid by you</span>}
          </div>

          <div className={`mt-4 grid gap-3 ${fixedPayer ? 'grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)]' : 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_10rem] lg:grid-cols-[13rem_10rem_minmax(0,1fr)]'}`}>
            {!fixedPayer && (
              <div>
                <label htmlFor="paid-by" className={ui.label}>Paid by</label>
                <select
                  id="paid-by"
                  value={form.paidById}
                  onChange={(e) => { setForm((f) => ({ ...f, paidById: e.target.value })); setError(''); }}
                  aria-invalid={!!show('paidBy')}
                  className={`${ui.input} ${show('paidBy') ? 'border-danger' : ''}`}
                >
                  <option value="">Choose a member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {show('paidBy') && <p className="text-sm text-danger mt-1">{show('paidBy')}</p>}
              </div>
            )}
            <div>
              <label htmlFor="amount" className={ui.label}>Amount ({currency})</label>
              <input
                id="amount"
                ref={amountRef}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => { setForm((f) => ({ ...f, amount: e.target.value })); setError(''); }}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                aria-invalid={!!show('amount')}
                className={`${ui.input} font-semibold ${show('amount') ? 'border-danger' : ''}`}
              />
              {(show('amount') || (form.amount && problems.amount && problems.amount !== 'Enter the amount.')) && (
                <p className="text-sm text-danger mt-1">{problems.amount}</p>
              )}
            </div>
            <div className={fixedPayer ? '' : 'sm:col-span-2 lg:col-span-1'}>
              <label htmlFor="description" className={ui.label}>
                What was it for? <span className="font-normal text-ink-2">(optional)</span>
              </label>
              <input
                id="description"
                type="text"
                maxLength={LIMITS.description}
                placeholder="e.g. Dinner, fuel, tickets"
                value={form.description}
                onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setError(''); }}
                className={ui.input}
              />
            </div>
          </div>

          <fieldset className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <legend className="text-sm font-semibold text-navy">Shared with</legend>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, sharedWithIds: f.sharedWithIds.length === allIds.length ? [] : allIds }))}
                className={`text-sm ${ui.link}`}
              >
                {form.sharedWithIds.length === allIds.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const on = form.sharedWithIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSharer(m.id)}
                    className={`h-9 px-3.5 rounded-full text-sm font-semibold border transition-colors ${
                      on ? 'bg-teal text-white border-teal' : 'bg-white text-ink-2 border-dashed border-line-2 hover:border-navy'
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>
            {show('shared') && <p className="text-sm text-danger mt-2">{show('shared')}</p>}
          </fieldset>

          <div className="mt-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-ink-2" aria-live="polite">
              {!problems.amount && form.sharedWithIds.length > 0
                ? `${formatMoney(amountNum / form.sharedWithIds.length, currency)} each, split ${form.sharedWithIds.length} ${form.sharedWithIds.length === 1 ? 'way' : 'ways'}`
                : ''}
            </p>
            <div className="flex gap-2">
              {editingId && (
                <button type="button" onClick={cancelEdit} className={ui.btnGhost}>
                  Cancel
                </button>
              )}
              <button type="submit" disabled={busy} className={`${ui.btnPrimary} flex-1 sm:flex-none`}>
                {busy ? 'Saving…' : editingId ? 'Update expense' : 'Add expense'}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-[0.9375rem] font-semibold text-danger bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              {error}
            </p>
          )}
          {flash && !error && (
            <p role="status" className="mt-3 text-[0.9375rem] font-semibold text-teal-2 bg-teal-soft rounded-2xl px-4 py-2.5">
              {flash}
            </p>
          )}
        </form>
      )}

      <section className={`${ui.card} overflow-hidden`} aria-label={fixedPayer ? 'Your expenses' : 'Expenses'}>
        <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-line">
          <h2 className={ui.sectionTitle}>
            {fixedPayer ? 'Your expenses' : 'Expenses'} <span className="text-ink-2 font-semibold">({shown.length})</span>
          </h2>
          <p className="font-display font-bold text-navy">
            {formatMoney(total, currency)}
            {filter && <span className="text-sm font-semibold text-ink-2"> paid by {nameOf(filter)}</span>}
          </p>
        </div>

        {!fixedPayer && perPayer.length > 1 && (
          <div className="px-4 sm:px-6 py-3 border-b border-line flex flex-wrap gap-2" role="group" aria-label="Show expenses paid by">
            <button
              type="button"
              aria-pressed={filter === null}
              onClick={() => setFilter(null)}
              className={`h-8 px-3 rounded-full text-sm font-semibold ${filter === null ? 'bg-peach text-navy' : 'bg-sky text-ink-2 hover:text-navy'}`}
            >
              Everyone
            </button>
            {perPayer.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={filter === m.id}
                onClick={() => setFilter(filter === m.id ? null : m.id)}
                className={`h-8 px-3 rounded-full text-sm font-semibold ${filter === m.id ? 'bg-peach text-navy' : 'bg-sky text-ink-2 hover:text-navy'}`}
              >
                {m.name} <span className="font-normal">{m.total.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
              </button>
            ))}
          </div>
        )}

        {shown.length === 0 ? (
          <p className="px-6 py-10 text-center text-[0.9375rem] text-ink-2">
            {readOnly ? 'No expenses.' : 'No expenses yet. Add the first one above.'}
          </p>
        ) : (
          <>
            {/* Wide screens: a table */}
            <table className={`hidden w-full text-[0.9375rem] ${fixedPayer ? '' : 'md:table'}`}>
              <thead>
                <tr className="text-left text-sm text-ink-2 bg-sky/60">
                  <th scope="col" className="font-semibold px-6 py-2.5">Expense</th>
                  {!fixedPayer && <th scope="col" className="font-semibold px-3 py-2.5">Paid by</th>}
                  <th scope="col" className="font-semibold px-3 py-2.5">Shared with</th>
                  <th scope="col" className="font-semibold px-3 py-2.5 text-right">Amount</th>
                  {!readOnly && <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((e) => (
                  <tr key={e.id} className={editingId === e.id ? 'bg-sunset-soft' : ''}>
                    <td className="px-6 py-3 font-semibold text-navy [overflow-wrap:anywhere]">
                      {e.description || <span className="font-normal text-ink-3">No description</span>}
                    </td>
                    {!fixedPayer && (
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-2 text-navy">
                          <Avatar name={nameOf(e.paidById)} size="sm" />
                          {nameOf(e.paidById)}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-3 text-ink-2 max-w-[16rem] [overflow-wrap:anywhere]">{sharedLabel(e)}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      <span className="font-display font-bold text-navy">{formatMoney(e.amount, currency)}</span>
                      <span className="block text-sm text-ink-2">{formatMoney(eachOf(e))} each</span>
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <RowActions e={e} label={e.description || `expense of ${formatMoney(e.amount)}`} onEdit={startEdit} onDelete={setPendingDelete} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phones: stacked rows */}
            <ul className={`divide-y divide-line ${fixedPayer ? '' : 'md:hidden'}`}>
              {shown.map((e) => (
                <li key={e.id} className={`px-4 py-3 ${editingId === e.id ? 'bg-sunset-soft' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-navy [overflow-wrap:anywhere]">
                        {e.description || (fixedPayer ? 'No description' : `Paid by ${nameOf(e.paidById)}`)}
                      </p>
                      <p className="text-sm text-ink-2 mt-0.5 [overflow-wrap:anywhere]">
                        {!fixedPayer && e.description ? `${nameOf(e.paidById)} paid, ` : ''}shared by {sharedLabel(e).replace('All members', 'all members')}
                      </p>
                    </div>
                    <p className="text-right shrink-0">
                      <span className="font-display font-bold text-navy whitespace-nowrap">{formatMoney(e.amount, currency)}</span>
                      <span className="block text-sm text-ink-2 whitespace-nowrap">{formatMoney(eachOf(e))} each</span>
                    </p>
                  </div>
                  {!readOnly && (
                    <div className="mt-1 -ml-2">
                      <RowActions e={e} label={e.description || `expense of ${formatMoney(e.amount)}`} onEdit={startEdit} onDelete={setPendingDelete} withText />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {(doneHref || backHref) && (
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2">
          {backHref ? (
            <Link href={backHref} className={ui.btnGhost}>Back to trip details</Link>
          ) : (
            <span />
          )}
          {doneHref && (
            <Link
              href={doneHref}
              aria-disabled={items.length === 0}
              className={`${ui.btnDark} ${items.length === 0 ? 'opacity-45 pointer-events-none' : ''}`}
            >
              See settlement
            </Link>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this expense?"
        confirmLabel="Delete expense"
        tone="danger"
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      >
        {pendingDelete && (
          <p>
            <strong>{pendingDelete.description || 'This expense'}</strong> ({formatMoney(pendingDelete.amount, currency)}, paid by{' '}
            {nameOf(pendingDelete.paidById)}) will be removed and the settlement recalculated.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}

function RowActions({
  e,
  label,
  onEdit,
  onDelete,
  withText = false,
}: {
  e: SavedExpense;
  label: string;
  onEdit: (e: SavedExpense) => void;
  onDelete: (e: SavedExpense) => void;
  withText?: boolean;
}) {
  const cls = withText
    ? 'inline-flex items-center gap-1.5 h-9 px-2 rounded-full text-sm font-semibold'
    : 'inline-flex items-center justify-center w-9 h-9 rounded-full';
  return (
    <span className="inline-flex gap-1">
      <button type="button" onClick={() => onEdit(e)} aria-label={`Edit ${label}`} title="Edit" className={`${cls} text-teal hover:bg-teal-soft`}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" /></svg>
        {withText && 'Edit'}
      </button>
      <button type="button" onClick={() => onDelete(e)} aria-label={`Delete ${label}`} title="Delete" className={`${cls} text-danger hover:bg-red-50`}>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {withText && 'Delete'}
      </button>
    </span>
  );
}
