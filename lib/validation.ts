export const CURRENCIES = [
  { code: 'AED', label: 'UAE Dirham' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CAD', label: 'Canadian Dollar' },
] as const;

export const LIMITS = {
  tripName: 80,
  memberName: 40,
  members: 50,
  description: 120,
  expensesPerMember: 200,
  maxAmount: 100_000_000,
};

export function isCurrency(code: string) {
  return CURRENCIES.some((c) => c.code === code);
}

/** Parses a yyyy-mm-dd string from a date input; returns null if invalid. */
export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Trims and collapses whitespace. */
export function cleanText(value: unknown, max: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Lower-cases and trims an email address. */
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

/**
 * Practical email check: one @, a dot in the domain, no spaces, sane lengths.
 * (Full RFC 5322 is not worth it; Supabase validates again on its side.)
 */
export function isValidEmail(value: string) {
  const email = value.trim();
  if (email.length < 6 || email.length > 254) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email) && !email.includes('..');
}

export const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Za-z]/.test(p), label: 'At least one letter' },
  { test: (p: string) => /\d/.test(p), label: 'At least one number' },
];

/** First unmet password rule as a sentence, or null when the password is fine. */
export function passwordProblem(p: string): string | null {
  if (p.length > 72) return 'Use 72 characters or fewer.';
  const failed = PASSWORD_RULES.find((r) => !r.test(p));
  return failed ? `Password needs: ${failed.label.toLowerCase()}.` : null;
}

/** Trip dates must be real calendar dates in a sensible range. */
export const DATE_MIN = '2000-01-01';
export const DATE_MAX = '2100-12-31';
export function isDateInRange(value: string) {
  const d = parseDateInput(value);
  // Reject dates JavaScript silently rolls over, such as 2026-02-31.
  return !!d && d.toISOString().slice(0, 10) === value && value >= DATE_MIN && value <= DATE_MAX;
}

/** Names must contain at least one letter or digit (not just punctuation). */
export function hasLetterOrDigit(value: string) {
  return /[\p{L}\p{N}]/u.test(value);
}
