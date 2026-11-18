import { PASSWORD_RULES } from '@/lib/validation';

/** Live checklist under a new-password field. */
export function PasswordRules({ value, id }: { value: string; id: string }) {
  return (
    <ul id={id} className="mt-2 grid gap-1 text-sm" aria-label="Password requirements">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.label} className={`flex items-center gap-2 ${ok ? 'text-teal' : 'text-ink-2'}`}>
            <span
              aria-hidden="true"
              className={`w-4 h-4 rounded-full inline-flex items-center justify-center ${ok ? 'bg-teal text-white' : 'border border-line-2'}`}
            >
              {ok && (
                <svg width="9" height="9" viewBox="0 0 12 12"><path d="M2.5 6.5l2.2 2.2L9.5 3.8" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </span>
            {r.label}
            <span className="sr-only">{ok ? '(done)' : '(not yet)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
