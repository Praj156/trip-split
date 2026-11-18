// Shared visual language ("Road trip" direction). Pages should build from
// these so sizes, radii and colours stay consistent.

export const ui = {
  card: 'bg-white rounded-[20px] border border-line',
  label: 'block text-sm font-semibold text-navy mb-1.5',
  hint: 'text-xs text-ink-2 mt-1',
  input:
    'w-full h-11 px-4 rounded-xl border border-line-2 bg-white text-base sm:text-[0.9375rem] text-navy placeholder-ink-3 outline-none transition-colors focus:border-teal focus:ring-4 focus:ring-teal/15 disabled:bg-sky disabled:text-ink-2',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-teal text-white text-[0.9375rem] font-bold hover:bg-teal-2 transition-colors disabled:opacity-45 disabled:cursor-not-allowed',
  btnDark:
    'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-navy text-white text-[0.9375rem] font-bold hover:bg-navy-2 transition-colors disabled:opacity-45',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-white text-navy text-[0.9375rem] font-semibold border border-line-2 hover:border-navy/40 transition-colors disabled:opacity-45 disabled:cursor-not-allowed',
  btnGhost:
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-[0.9375rem] font-semibold text-ink-2 hover:text-navy hover:bg-white transition-colors',
  btnDangerGhost:
    'inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-[0.9375rem] font-semibold text-danger hover:bg-red-50 transition-colors',
  btnDanger:
    'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-danger text-white text-[0.9375rem] font-bold hover:bg-red-800 transition-colors disabled:opacity-50',
  pageTitle: 'font-display text-[1.75rem] sm:text-[2.125rem] font-extrabold tracking-[-0.01em] text-navy leading-[1.1]',
  sectionTitle: 'font-display text-lg font-bold text-navy',
  link: 'font-semibold text-teal hover:text-teal-2 underline-offset-2 hover:underline',
};

/** Initial of a member name, skipping a leading "The" (e.g. "The Sharmas" → S). */
export const initialOf = (name: string) => name.trim().replace(/^the\s+/i, '').charAt(0).toUpperCase() || '?';

export function Avatar({
  name,
  tone = 'navy',
  size = 'md',
}: {
  name: string;
  tone?: 'navy' | 'sunset' | 'teal' | 'muted';
  size?: 'sm' | 'md' | 'lg';
}) {
  const tones = {
    navy: 'bg-[#e3ebf3] text-navy',
    sunset: 'bg-sunset-soft text-sunset-ink',
    teal: 'bg-teal-soft text-teal-2',
    muted: 'bg-sky text-ink-2',
  }[tone];
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base' }[size];
  return (
    <span aria-hidden="true" className={`${sz} ${tones} shrink-0 rounded-full inline-flex items-center justify-center font-bold`}>
      {initialOf(name)}
    </span>
  );
}

export function StatusBadge({ status, onDark = false }: { status: string; onDark?: boolean }) {
  const active = status === 'active';
  const style = onDark
    ? active
      ? 'bg-teal-mid/20 text-[#bfe9e5] print:bg-teal-soft print:text-teal-2'
      : 'bg-white/15 text-white print:bg-[#e9eef4] print:text-ink-2'
    : active
      ? 'bg-teal-soft text-teal-2'
      : 'bg-[#e9eef4] text-ink-2';
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-bold ${style}`}>
      <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-teal-mid' : 'bg-current'}`} />
      {active ? 'Active' : 'Completed'}
    </span>
  );
}

/** Steps of the trip setup flow. */
export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Trip details', 'Expenses', 'Settle up'];
  return (
    <ol className="flex items-center gap-2 text-sm font-semibold" aria-label="Progress">
      {steps.map((s, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'current' : 'todo';
        return (
          <li key={s} className="flex items-center gap-2" aria-current={state === 'current' ? 'step' : undefined}>
            <span
              className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                state === 'todo' ? 'bg-white border border-line-2 text-ink-2' : state === 'current' ? 'bg-sunset text-navy' : 'bg-navy text-white'
              }`}
            >
              {state === 'done' ? (
                <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                n
              )}
            </span>
            <span className={`${state === 'current' ? 'text-navy' : 'text-ink-2 hidden sm:inline'}`}>{s}</span>
            {n < steps.length && <span aria-hidden="true" className="w-5 sm:w-10 border-t-2 border-dashed border-line-2" />}
          </li>
        );
      })}
    </ol>
  );
}
