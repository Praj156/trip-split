import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { UserMenu } from '@/app/components/UserMenu';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect('/sign-in');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f9fc' }}>
      <header className="sticky top-0 z-40 border-b border-slate-200/70 backdrop-blur-md" style={{ background: 'rgba(248,249,252,0.85)' }}>
        <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-sm" style={{ background: 'linear-gradient(135deg, #2563eb, #0ea5e9)' }}>T</div>
            <span className="font-black text-slate-900 tracking-tighter uppercase text-sm">TripSplit</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors hidden sm:block">My Trips</Link>
            <UserMenu />
          </div>
        </nav>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="border-t border-slate-200/60 py-4" style={{ background: 'rgba(248,249,252,0.9)' }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">© {new Date().getFullYear()} TripSplit</p>
        </div>
      </footer>
    </div>
  );
}
