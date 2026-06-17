import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const session = await getCurrentUser();
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 selection:bg-indigo-100 overflow-hidden">

      {/* BACKGROUND DECORATION - High-end premium dynamic blurs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-600/5 rounded-full blur-[120px] animate-pulse duration-10000" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] animate-pulse duration-8000" />
      </div>

      {/* HEADER NAVIGATION - Transparent & Glassy */}
      <header className="relative z-20 border-b border-slate-200/20 bg-white/20 backdrop-blur-md">
        <nav className="flex justify-between items-center px-8 py-4 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-linear-to-tr from-indigo-950 to-indigo-800 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-105 transition-transform">
              T
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight uppercase">
              Trip<span className="text-indigo-600">Split</span>
            </span>
          </div>
          <Link
            href="/sign-in"
            className="border border-indigo-600/30 text-indigo-700 hover:bg-indigo-600 hover:text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md hover:shadow-indigo-600/10 active:scale-95"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* MAIN HERO CONTENT */}
      <main className="relative z-10 grow max-w-4xl mx-auto px-6 pt-16 pb-20 flex flex-col items-center justify-center text-center">
        
        {/* Subtle, abstract spending route/trip map Visual Hook */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-40">
          <svg className="w-full max-w-3xl h-96" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 280 C 220 180, 250 320, 400 200 C 550 80, 580 250, 700 120" stroke="url(#routeGradient)" strokeWidth="2" strokeDasharray="6 6" />
            <path d="M100 280 L 220 210" stroke="#00a381" strokeWidth="0.75" opacity="0.2" />
            <path d="M400 200 L 580 215" stroke="#c27357" strokeWidth="0.75" opacity="0.2" />
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00a381" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#c27357" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#083f37" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="280" r="5" fill="#00a381" />
            <circle cx="100" cy="280" r="10" stroke="#00a381" strokeWidth="1" opacity="0.3" />
            <circle cx="220" cy="210" r="4" fill="#c27357" />
            <circle cx="400" cy="200" r="6" fill="#083f37" />
            <circle cx="400" cy="200" r="12" stroke="#00a381" strokeWidth="1" opacity="0.4" />
            <circle cx="580" cy="215" r="4" fill="#00a381" />
            <circle cx="700" cy="120" r="5" fill="#c27357" />
            <circle cx="700" cy="120" r="10" stroke="#c27357" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 mb-8 text-[9px] font-black tracking-[0.25em] text-indigo-700 uppercase bg-white/70 border border-indigo-100/80 rounded-full shadow-xs backdrop-blur-sm">
            ✨ SIMPLE • FAIR • TRANSPARENT
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-950 mb-6 leading-[1.08] tracking-tight">
            Shared trips,<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 via-blue-500 to-orange-500 font-black text-6xl md:text-7xl lg:text-8xl block mt-2">
              simplified spending.
            </span>
          </h2>

          <p className="text-base md:text-lg text-slate-600 max-w-lg mx-auto mb-12 font-medium leading-relaxed">
            Split bills across participants, manage custom rules,
            and see who owes whom in seconds.
          </p>

          <div className="mb-16">
            <Link
              href="/sign-up"
              className="bg-indigo-600 text-white px-10 py-4.5 rounded-2xl font-extrabold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-[0_10px_35px_rgba(8,63,55,0.2)] hover:shadow-[0_15px_40px_rgba(8,63,55,0.3)] transition-all hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.98] duration-300 inline-block"
            >
              START YOUR FIRST TRIP
            </Link>
          </div>

          {/* FEATURE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl relative z-20">
            
            <div className="backdrop-blur-md bg-white/45 border border-slate-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.01)] hover:border-indigo-500/20 hover:shadow-[0_15px_35px_rgba(8,63,55,0.06)] hover:-translate-y-1 p-8 rounded-3xl text-center group transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-200 shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Precise Splitting SVG Icon */}
                  <rect x="3" y="15" width="4" height="6" rx="1" fill="#00a381" />
                  <rect x="10" y="8" width="4" height="13" rx="1" fill="#083f37" />
                  <rect x="17" y="12" width="4" height="9" rx="1" fill="#c27357" />
                  <path d="M4 4L20 18" stroke="#00a381" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
              </div>
              <h3 className="font-black text-base text-slate-900 mb-1.5">Precise Splitting</h3>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">Select exactly which members participated in every single expense item.</p>
            </div>

            <div className="backdrop-blur-md bg-white/45 border border-slate-500/10 shadow-[0_4px_30px_rgba(0,0,0,0.01)] hover:border-indigo-500/20 hover:shadow-[0_15px_35px_rgba(8,63,55,0.06)] hover:-translate-y-1 p-8 rounded-3xl text-center group transition-all duration-300">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 border border-slate-200 shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Auto-Settlement SVG Icon */}
                  <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#083f37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="5" cy="12" r="3" fill="#00a381" />
                </svg>
              </div>
              <h3 className="font-black text-base text-slate-900 mb-1.5">Auto-Settlement</h3>
              <p className="text-slate-500 text-xs font-semibold leading-relaxed">Get the most efficient, calculated path to settle all balances with one report.</p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 py-6 mt-auto bg-slate-100/5 border-t border-slate-200/10 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} TripSplit
          </p>
        </div>
      </footer>
    </div>

  );
}