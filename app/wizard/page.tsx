import { checkUser } from '../actions/user';
import { redirect } from 'next/navigation';
import NewTripForm from './NewTripForm';

export default async function WizardPage() {
  const user = await checkUser();
  if (!user) redirect('/sign-in');

  return (
    <div className="max-w-xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
            <div className="w-8 h-0.5 bg-slate-200 rounded" />
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-[10px] font-black flex items-center justify-center">2</span>
            <div className="w-8 h-0.5 bg-slate-200 rounded" />
            <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 text-[10px] font-black flex items-center justify-center">3</span>
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-900 mt-4">New Trip</h1>
        <p className="text-sm text-slate-500">Set the trip details and add who's going.</p>
      </div>

      <NewTripForm defaultCurrency={user.defaultCurrency || 'AED'} />
    </div>
  );
}
