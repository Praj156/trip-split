import { redirect } from 'next/navigation';
import { checkUser } from '@/lib/auth';
import { ui } from '@/app/components/ui';
import ProfileForm from './ProfileForm';

export const metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const user = await checkUser();
  if (!user) redirect('/sign-in');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="max-w-2xl space-y-5">
      <div>
        <h1 className={ui.pageTitle}>Profile and settings</h1>
        <p className="text-sm text-ink-2 mt-1">Your name and the currency new trips start with.</p>
      </div>
      <ProfileForm initialData={{ name: user.name || '', defaultCurrency: user.defaultCurrency, email: user.email }} />
      </div>
    </div>
  );
}
