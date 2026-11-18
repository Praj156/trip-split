import { redirect } from 'next/navigation';
import { checkUser } from '@/lib/auth';
import { Steps, ui } from '@/app/components/ui';
import NewTripForm from './NewTripForm';

export const metadata = { title: 'New trip' };

export default async function WizardPage() {
  const user = await checkUser();
  if (!user) redirect('/sign-in');

  return (
    <div className="max-w-2xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Steps current={1} />
      <h1 className={`${ui.pageTitle} mt-4`}>New trip</h1>
      <p className="text-sm text-ink-2 mt-1 mb-5">Set the basics and add the members who came along.</p>
      <NewTripForm defaultCurrency={user.defaultCurrency || 'AED'} />
    </div>
  );
}
