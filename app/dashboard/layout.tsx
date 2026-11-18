import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { AppShell } from '@/app/components/AppShell';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/sign-in');
  return <AppShell email={user.email ?? ''}>{children}</AppShell>;
}
