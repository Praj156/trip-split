// Run with: npm test   (uses Node's built-in test runner; Node 22.6+)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBalances, computeSettlements, effectiveSharers, roundMoney } from '../lib/settlement.ts';

const people = [
  { id: 'a', name: 'Raj' },
  { id: 'b', name: 'Meera' },
  { id: 'c', name: 'Sam' },
];
const sum = (xs) => roundMoney(xs.reduce((s, x) => s + x, 0));

test('equal split: balances sum to zero and one person is repaid', () => {
  const bal = computeBalances(people, [{ amount: 90, paidById: 'a', sharedWithIds: ['a', 'b', 'c'] }]);
  assert.deepEqual(bal, { a: 60, b: -30, c: -30 });
  const t = computeSettlements(people, bal);
  assert.deepEqual(t.map((x) => [x.from, x.to, x.amount]), [['Meera', 'Raj', 30], ['Sam', 'Raj', 30]]);
});

test('subset split only charges the people who shared', () => {
  const bal = computeBalances(people, [{ amount: 50, paidById: 'c', sharedWithIds: ['a', 'c'] }]);
  assert.deepEqual(bal, { a: -25, b: 0, c: 25 });
});

test('ids of removed members are ignored, so money never disappears', () => {
  const bal = computeBalances(people, [{ amount: 100, paidById: 'a', sharedWithIds: ['a', 'ghost'] }]);
  assert.deepEqual(bal, { a: 0, b: 0, c: 0 });
  assert.equal(sum(Object.values(bal)), 0);
});

test('an expense shared with nobody valid falls back to the payer', () => {
  const e = { amount: 40, paidById: 'b', sharedWithIds: ['ghost'] };
  assert.deepEqual(effectiveSharers(e, new Set(['a', 'b', 'c'])), ['b']);
});

test('duplicate sharer ids are counted once', () => {
  const bal = computeBalances(people, [{ amount: 30, paidById: 'a', sharedWithIds: ['b', 'b', 'c'] }]);
  assert.deepEqual(bal, { a: 30, b: -15, c: -15 });
});

test('thirds settle within a cent', () => {
  const bal = computeBalances(people, [{ amount: 100, paidById: 'a', sharedWithIds: ['a', 'b', 'c'] }]);
  const t = computeSettlements(people, bal);
  assert.equal(t.length, 2);
  assert.ok(Math.abs(sum(t.map((x) => x.amount)) - 66.67) < 0.015);
});

test('settlements always clear every balance (randomised)', () => {
  for (let run = 0; run < 300; run++) {
    const n = 2 + (run % 9);
    const ms = Array.from({ length: n }, (_, i) => ({ id: `m${i}`, name: `M${i}` }));
    const ex = Array.from({ length: 1 + (run % 13) }, (_, k) => {
      const share = ms.filter((_, i) => (i + k + run) % 3 !== 0).map((m) => m.id);
      return { amount: roundMoney(((run * 37 + k * 101) % 5000) / 7 + 1), paidById: ms[(k * 7 + run) % n].id, sharedWithIds: share };
    });
    const bal = computeBalances(ms, ex);
    const t = computeSettlements(ms, bal);
    assert.ok(t.length <= n - 1, 'at most n-1 transfers');
    const after = { ...bal };
    for (const x of t) { after[x.fromId] += x.amount; after[x.toId] -= x.amount; }
    for (const v of Object.values(after)) assert.ok(Math.abs(v) <= 0.01 * n, `residual ${v}`);
  }
});

test('zero and negative amounts are ignored', () => {
  const bal = computeBalances(people, [
    { amount: 0, paidById: 'a', sharedWithIds: ['b'] },
    { amount: -20, paidById: 'a', sharedWithIds: ['b'] },
  ]);
  assert.deepEqual(bal, { a: 0, b: 0, c: 0 });
});
