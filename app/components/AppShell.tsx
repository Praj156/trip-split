import Link from 'next/link';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';

/** Header + footer for signed-in pages. */
export function AppShell({ children, email }: { children: React.ReactNode; email: string }) {
  return (
    <div className="min-h-screen flex flex-col bg-sky">
      <header className="sticky top-0 z-40 bg-white border-b border-line">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Logo href="/dashboard" size="sm" />
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/dashboard" className="hidden sm:inline-flex h-10 items-center px-3 rounded-full text-[0.9375rem] font-semibold text-ink-2 hover:text-navy hover:bg-sky transition-colors">
              My trips
            </Link>
            <UserMenu email={email} />
          </div>
        </nav>
      </header>

      <main className="grow">{children}</main>

      <footer className="mt-6 bg-navy text-[#d7e2ec] no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <Logo href="/dashboard" size="sm" tone="light" />
          <p className="text-sm">© {new Date().getFullYear()} TripSplit · Split trip expenses fairly</p>
        </div>
      </footer>
    </div>
  );
}
