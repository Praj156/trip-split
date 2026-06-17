import { getUserProfile } from '../actions/user';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';
import Link from 'next/link';

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
          Your Profile
        </h1>
        <p className="text-sm text-slate-500 font-medium">Manage your account settings and preferences.</p>
        <div>
          <Link href="/dashboard" className="text-xs font-bold text-indigo-600 hover:underline">← Back to dashboard</Link>
        </div>
      </div>

      <ProfileForm initialData={{ name: user.name || '', defaultCurrency: user.defaultCurrency, email: user.email }} />
    </div>
  );
}
