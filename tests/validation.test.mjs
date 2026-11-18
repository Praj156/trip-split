import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, passwordProblem, isDateInRange, hasLetterOrDigit } from '../lib/validation.ts';

test('emails', () => {
  for (const ok of ['a@b.co', 'priya.k+trip@gmail.com', 'X@Example.ORG', 'name@mail.co.in']) assert.ok(isValidEmail(ok), ok);
  for (const bad of ['', 'abc', 'abc@', '@mail.com', 'abc@mail', 'a b@mail.com', 'abc@@mail.com', 'abc@mail..com', 'abc@.com']) assert.ok(!isValidEmail(bad), bad);
});

test('passwords', () => {
  assert.equal(passwordProblem('secret123'), null);
  assert.match(passwordProblem('abc1'), /8 characters/);
  assert.match(passwordProblem('abcdefgh'), /number/);
  assert.match(passwordProblem('12345678'), /letter/);
  assert.match(passwordProblem('a1'.repeat(40)), /72/);
});

test('dates', () => {
  assert.ok(isDateInRange('2026-10-14'));
  assert.ok(!isDateInRange('2026-02-31'));
  assert.ok(!isDateInRange('1999-12-31'));
  assert.ok(!isDateInRange('20261-01-01'));
});

test('names need a letter or digit', () => {
  assert.ok(hasLetterOrDigit('Raj'));
  assert.ok(hasLetterOrDigit('राज'));
  assert.ok(hasLetterOrDigit('Team 2'));
  assert.ok(!hasLetterOrDigit('???'));
});
