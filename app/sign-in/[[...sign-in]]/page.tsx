import SignInForm from './SignInForm';

export const metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; email?: string }>;
}) {
  const { next, error, email } = await searchParams;
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
  return <SignInForm next={safeNext} linkError={error === 'link'} initialEmail={(email ?? '').slice(0, 254)} />;
}
