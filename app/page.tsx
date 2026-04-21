import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <div className="min-h-screen flex flex-col relative bg-slate-50 selection:bg-blue-100">
      
      {/* BACKGROUND DECORATION - These stay vibrant */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-blue-500/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-teal-400/15 rounded-full blur-[100px]" />
      </div>

      {/* HEADER NAVIGATION - Transparent & Airy */}
      <header className="relative z-20">
        <nav className="flex justify-between items-center px-8 py-6 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md shadow-gray-200">
              T
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase">TripSplit</h1>
          </div>
          <Link 
            href="/sign-in" 
            className="bg-gray-900 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-md"
          >
            Sign In
          </Link>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="relative z-10 grow max-w-4xl mx-auto px-6 pt-2 pb-12 flex flex-col items-center justify-center text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase bg-white/50 border border-blue-100 rounded-full shadow-sm backdrop-blur-sm">
          Simple • Fair • Transparent
        </div>
        
        <h2 className="text-4xl md:text-5xl lg:text-5xl font-black text-gray-900 mb-4 leading-[1.15] tracking-tight">
          Shared trips, <br /> 
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 via-indigo-500 to-teal-500 font-extrabold">
            simplified spending.
          </span>
        </h2>
        
        <p className="text-base md:text-lg text-gray-600 max-w-lg mx-auto mb-10 font-medium leading-relaxed">
          Split bills across participants, manage custom rules, 
          and see who owes whom in seconds.
        </p>
        
        <div className="mb-14">
          <Link 
            href="/sign-in" 
            className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 inline-block"
          >
            Start Your First Trip
          </Link>
        </div>

        {/* FEATURE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-3xl">
          <div className="bg-white/40 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm text-center">
            <h3 className="font-black text-lg text-gray-900 mb-1.5">Custom Groups</h3>
            <p className="text-gray-500 text-xs font-medium leading-relaxed">Organize participants into custom groups for smarter tracking.</p>
          </div>
          
          <div className="bg-white/40 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm text-center">
            <h3 className="font-black text-lg text-gray-900 mb-1.5">Precise Splitting</h3>
            <p className="text-gray-500 text-xs font-medium leading-relaxed">Select exactly which members owe for every individual expense.</p>
          </div>

          <div className="bg-white/40 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-sm text-center">
            <h3 className="font-black text-lg text-gray-900 mb-1.5">Auto-Settlement</h3>
            <p className="text-gray-500 text-xs font-medium leading-relaxed">Get the most efficient path to settle all debts with one summary.</p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 py-6 mt-auto bg-slate-100/30 border-t border-slate-200/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} TripSplit
          </p>
        </div>
      </footer>
    </div>
  );
}