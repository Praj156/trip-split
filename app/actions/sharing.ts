'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getMemberByToken, isUuid, newShareToken, requireOwnedTrip } from '@/lib/access';
import { cleanText, LIMITS } from '@/lib/validation';
import { roundMoney } from '@/lib/settlement';
import type { ActionResult } from './trip';

/** Who is editing: the trip owner (signed in) or a member through their link. */
export type EditorMode = { kind: 'owner'; tripId: string } | { kind: 'member'; token: string };

export interface ExpenseInput {
  paidById: string;
  amount: number;
  description: string;
  sharedWithIds: string[];
}

export interface SavedExpense {
  id: string;
  paidById: string;
  amount: number;
  description: string;
  sharedWithIds: string[];
  createdAt: string;
}

type Context = { tripId: string; memberIds: Set<string>; canPayAs: (id: string) => boolean; paths: string[] };

/** Resolves and checks who may edit which payer's expenses, or returns an error message. */
async function resolve(mode: EditorMode): Promise<Context | string> {
  if (mode?.kind === 'owner') {
    let trip;
    try {
      trip = await requireOwnedTrip(mode.tripId);
    } catch {
      return 'Trip not found.';
    }
    if (trip.status !== 'active') return 'This trip is completed, so expenses can no longer be changed. Reopen it first.';
    const members = await db.member.findMany({ where: { tripId: trip.id }, select: { id: true } });
    const memberIds = new Set(members.map((m) => m.id));
    return { tripId: trip.id, memberIds, canPayAs: (id) => memberIds.has(id), paths: [] };
  }
  if (mode?.kind === 'member') {
    const member = await getMemberByToken(mode.token);
    if (!member) return 'This link is no longer valid. Ask the trip organiser for a new one.';
    if (member.trip.status !== 'active') return 'This trip has been marked as completed, so expenses can no longer be changed.';
    const members = await db.member.findMany({ where: { tripId: member.tripId }, select: { id: true } });
    return {
      tripId: member.tripId,
      memberIds: new Set(members.map((m) => m.id)),
      canPayAs: (id) => id === member.id,
      paths: [`/m/${mode.token}`],
    };
  }
  return 'Unknown editor.';
}

function validate(ctx: Context, input: ExpenseInput): { data: Omit<ExpenseInput, 'paidById'> & { paidById: string } } | { error: string } {
  if (!input || !isUuid(String(input.paidById)) || !ctx.canPayAs(input.paidById)) return { error: 'Choose who paid.' };
  const raw = Number(input.amount);
  if (!Number.isFinite(raw) || raw <= 0) return { error: 'Enter an amount greater than 0.' };
  const amount = roundMoney(raw);
  if (amount > LIMITS.maxAmount) return { error: 'That amount is too large.' };
  const sharedWithIds = Array.from(new Set(input.sharedWithIds ?? [])).filter((id) => ctx.memberIds.has(id));
  if (sharedWithIds.length === 0) return { error: 'Pick at least one member to share this expense.' };
  return { data: { paidById: input.paidById, amount, description: cleanText(input.description, LIMITS.description), sharedWithIds } };
}

const toSaved = (e: { id: string; paidById: string; amount: number; description: string; sharedWithIds: string[]; createdAt: Date }): SavedExpense => ({
  id: e.id,
  paidById: e.paidById,
  amount: e.amount,
  description: e.description,
  sharedWithIds: e.sharedWithIds,
  createdAt: e.createdAt.toISOString(),
});

function refresh(ctx: Context) {
  revalidatePath(`/wizard/${ctx.tripId}`, 'layout');
  revalidatePath('/dashboard');
  ctx.paths.forEach((p) => revalidatePath(p));
}

/** Adds one expense. Saved immediately. */
export async function addExpense(mode: EditorMode, input: ExpenseInput): Promise<ActionResult<SavedExpense>> {
  const ctx = await resolve(mode);
  if (typeof ctx === 'string') return { ok: false, error: ctx };
  const v = validate(ctx, input);
  if ('error' in v) return { ok: false, error: v.error };
  const count = await db.expense.count({ where: { tripId: ctx.tripId, paidById: v.data.paidById } });
  if (count >= LIMITS.expensesPerMember) return { ok: false, error: `A member can have up to ${LIMITS.expensesPerMember} expenses.` };
  const e = await db.expense.create({ data: { ...v.data, tripId: ctx.tripId } });
  refresh(ctx);
  return { ok: true, data: toSaved(e) };
}

/** Changes one expense. Members can only change expenses they paid. */
export async function updateExpense(mode: EditorMode, id: string, input: ExpenseInput): Promise<ActionResult<SavedExpense>> {
  const ctx = await resolve(mode);
  if (typeof ctx === 'string') return { ok: false, error: ctx };
  if (!isUuid(id)) return { ok: false, error: 'Expense not found.' };
  const existing = await db.expense.findFirst({ where: { id, tripId: ctx.tripId } });
  if (!existing || !ctx.canPayAs(existing.paidById)) return { ok: false, error: 'This expense was deleted or you can’t change it.' };
  const v = validate(ctx, input);
  if ('error' in v) return { ok: false, error: v.error };
  const e = await db.expense.update({ where: { id }, data: v.data });
  refresh(ctx);
  return { ok: true, data: toSaved(e) };
}

/** Deletes one expense. Members can only delete expenses they paid. */
export async function deleteExpense(mode: EditorMode, id: string): Promise<ActionResult> {
  const ctx = await resolve(mode);
  if (typeof ctx === 'string') return { ok: false, error: ctx };
  if (!isUuid(id)) return { ok: false, error: 'Expense not found.' };
  const existing = await db.expense.findFirst({ where: { id, tripId: ctx.tripId } });
  if (!existing) return { ok: true, data: undefined }; // already gone
  if (!ctx.canPayAs(existing.paidById)) return { ok: false, error: 'You can only delete expenses you paid.' };
  await db.expense.delete({ where: { id } });
  refresh(ctx);
  return { ok: true, data: undefined };
}

export interface MemberLink {
  memberId: string;
  name: string;
  token: string;
}

/** Owner: make sure every member has a personal link, and return them all. */
export async function getMemberLinks(tripId: string): Promise<ActionResult<MemberLink[]>> {
  let trip;
  try {
    trip = await requireOwnedTrip(tripId);
  } catch {
    return { ok: false, error: 'Trip not found.' };
  }
  const members = await db.member.findMany({ where: { tripId: trip.id }, orderBy: { name: 'asc' } });
  const links: MemberLink[] = [];
  for (const m of members) {
    let token = m.shareToken;
    if (!token) {
      token = newShareToken();
      await db.member.update({ where: { id: m.id }, data: { shareToken: token } });
    }
    links.push({ memberId: m.id, name: m.name, token });
  }
  return { ok: true, data: links };
}

/** Owner: invalidate a member's link and issue a new one. */
export async function resetMemberLink(tripId: string, memberId: string): Promise<ActionResult<string>> {
  try {
    const trip = await requireOwnedTrip(tripId);
    const token = newShareToken();
    const res = await db.member.updateMany({ where: { id: memberId, tripId: trip.id }, data: { shareToken: token } });
    if (res.count === 0) return { ok: false, error: 'Member not found.' };
    return { ok: true, data: token };
  } catch {
    return { ok: false, error: 'Trip not found.' };
  }
}
