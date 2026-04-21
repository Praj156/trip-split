// app/wizard/page.tsx
import { checkUser } from '../actions/user';
import { redirect } from 'next/navigation';
import TripStepOneForm from './TripStepOneForm'; // We will define this below or in the same file

export default async function WizardPage() {
  // 1. SERVER-SIDE SECURITY & DB SYNC
  // This runs on the server. If someone bypasses middleware somehow, 
  // this will still catch them.
  const user = await checkUser();
  
  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Plan a New Trip</h1>
        <p className="text-gray-500 font-medium">Step 1: The Basics</p>
      </div>

      {/* 2. CLIENT-SIDE VALIDATION FORM */}
      {/* We pass the form logic to a client component */}
      <TripStepOneForm />
    </div>
  );
}

