import { Logo } from './Logo';
import { ui } from './ui';

/** Shared frame for sign-in, sign-up and password pages. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-sky">
      {/* Brand panel, wide screens only */}
      <aside className="hidden lg:flex w-[44%] max-w-[38.75rem] bg-navy text-white flex-col justify-between p-10 relative overflow-hidden">
        <Logo tone="light" />
        <div className="relative z-10">
          <p className="font-display text-[2.5rem] leading-[1.08] font-extrabold tracking-[-0.01em] max-w-[13em]">
            Every stop on the trip, split fairly.
          </p>
          <p className="mt-4 text-[1.0625rem] text-[#d7e2ec] max-w-[28em]">
            Members add what they paid along the way. The trip ends with a short list of who pays whom.
          </p>
        </div>
        <svg aria-hidden="true" viewBox="0 0 600 220" className="absolute left-0 right-0 bottom-24 w-full opacity-90">
          <path d="M-20 170 C 100 60, 200 200, 300 120 S 480 40, 640 110" stroke="#1d4462" strokeWidth="26" fill="none" strokeLinecap="round" />
          <path d="M-20 170 C 100 60, 200 200, 300 120 S 480 40, 640 110" stroke="#ffc48c" strokeWidth="2" strokeDasharray="10 12" fill="none" />
          <circle cx="110" cy="112" r="10" fill="#ff9b5c" />
          <circle cx="300" cy="120" r="10" fill="#7fd6cf" />
          <circle cx="470" cy="72" r="10" fill="#ff9b5c" />
        </svg>
        <p className="relative z-10 text-sm text-[#d7e2ec]">Only the organiser needs an account. Members just open their link.</p>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 sm:px-6 h-16 flex items-center lg:hidden bg-white border-b border-line">
          <Logo />
        </header>
        <main className="grow flex items-start lg:items-center justify-center px-4 pb-12 pt-4 lg:pt-0">
          <div className="w-full max-w-md">
            <div className="bg-white border border-line rounded-[24px] p-6 sm:p-8">
              <h1 className="font-display text-[1.75rem] font-extrabold text-navy tracking-tight leading-tight">{title}</h1>
              {subtitle && <p className="text-ink-2 text-[0.9375rem] mt-1.5 mb-6">{subtitle}</p>}
              {!subtitle && <div className="mb-6" />}
              {children}
            </div>
            {footer && <div className="text-center text-[0.9375rem] text-ink-2 mt-6">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}

export const inputClass = ui.input;
export const labelClass = ui.label;
export const primaryButtonClass = `${ui.btnPrimary} w-full`;
export const linkClass = 'font-semibold text-teal underline-offset-2 hover:underline';

export function FormMessage({ kind, children }: { kind: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const styles = {
    error: 'bg-red-50 border-red-200 text-danger',
    success: 'bg-teal-soft border-teal-mid text-teal-2',
    info: 'bg-sky border-line text-navy',
  }[kind];
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`px-4 py-3 border rounded-2xl text-[0.9375rem] ${styles}`}>
      {children}
    </div>
  );
}
