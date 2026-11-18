// Pure settlement maths, shared by the summary page, the member page and the
// landing-page demo. No framework imports, so it can be unit-tested directly.

export interface SettlementMember {
  id: string;
  name: string;
}

export interface SettlementExpense {
  amount: number;
  paidById: string;
  sharedWithIds: string[];
}

export interface Transfer {
  fromId: string;
  from: string;
  toId: string;
  to: string;
  amount: number;
}

const EPSILON = 0.005;

/** Round to whole cents, avoiding floating-point drift (e.g. 0.1 + 0.2). */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Only ids that still belong to the trip count towards a split. If none are
 * left (e.g. every sharer was removed) the payer carries the whole cost, so
 * money never silently disappears from the totals.
 */
export function effectiveSharers(expense: SettlementExpense, memberIds: Set<string>): string[] {
  const unique = Array.from(new Set(expense.sharedWithIds)).filter((id) => memberIds.has(id));
  return unique.length > 0 ? unique : [expense.paidById];
}

/** Net balance per member: positive = should receive, negative = owes. */
export function computeBalances(
  members: SettlementMember[],
  expenses: SettlementExpense[],
): Record<string, number> {
  const memberIds = new Set(members.map((m) => m.id));
  const balances: Record<string, number> = {};
  members.forEach((m) => (balances[m.id] = 0));

  for (const expense of expenses) {
    if (!memberIds.has(expense.paidById) || !(expense.amount > 0)) continue;
    balances[expense.paidById] += expense.amount;
    const sharers = effectiveSharers(expense, memberIds);
    const share = expense.amount / sharers.length;
    sharers.forEach((id) => (balances[id] -= share));
  }

  for (const id of Object.keys(balances)) balances[id] = roundMoney(balances[id]);
  return balances;
}

/**
 * Walks debtors and creditors in member order and pairs them off (the same
 * pairing the app has always used). Produces at most n-1 transfers.
 */
export function computeSettlements(
  members: SettlementMember[],
  balances: Record<string, number>,
): Transfer[] {
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? 'Unknown';
  const debtors = Object.entries(balances)
    .filter(([, b]) => b < -EPSILON)
    .map(([id, b]) => ({ id, amount: -b }));
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > EPSILON)
    .map(([id, b]) => ({ id, amount: b }));

  const transfers: Transfer[] = [];
  while (debtors.length && creditors.length) {
    const d = debtors[0];
    const c = creditors[0];
    const amount = roundMoney(Math.min(d.amount, c.amount));
    if (amount > EPSILON) {
      transfers.push({ fromId: d.id, from: nameOf(d.id), toId: c.id, to: nameOf(c.id), amount });
    }
    d.amount -= amount;
    c.amount -= amount;
    if (d.amount <= EPSILON) debtors.shift();
    if (c.amount <= EPSILON) creditors.shift();
  }
  return transfers;
}

export function formatMoney(value: number, currency?: string): string {
  const n = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${n} ${currency}` : n;
}
