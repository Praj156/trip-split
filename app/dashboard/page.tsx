import { checkUser } from '../actions/user';
import { db } from '@/lib/db';
import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';

export default async function DashboardPage() {
  // 1. Trigger database sync/check
  const user = await checkUser();

  // 2. Fetch user's trips from Prisma
  const trips = await db.trip.findMany({
    where: {
      userId: user?.id,
    }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* DASHBOARD HEADER */}
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">
            T
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* WELCOME SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Welcome back!
            </h2>
            <p className="text-slate-500 font-medium">
              You have {trips.length} active {trips.length === 1 ? 'trip' : 'trips'}.
            </p>
          </div>
          <Link 
            href="/wizard"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 w-fit"
          >
            <span className="text-xl">+</span> New Trip
          </Link>
        </div>

        {/* TRIPS GRID */}
        {trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Link 
                key={trip.id} 
                href={`/dashboard/trips/${trip.id}`}
                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    ✈️
                  </div>
                  
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-1">{trip.name}</h3>
                <p className="text-slate-500 text-sm font-medium">View expenses & settlements →</p>
              </Link>
            ))}
          </div>
        ) : (
          /* EMPTY STATE */
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              🗺️
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No trips found</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              Ready to split some costs? Create your first trip to get started.
            </p>
            <Link 
              href="/dashboard/trips/new"
              className="text-blue-600 font-bold hover:underline"
            >
              Create your first trip now
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}