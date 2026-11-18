import ForgotPasswordForm from './ForgotPasswordForm';

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return <ForgotPasswordForm initialEmail={(email ?? '').slice(0, 254)} />;
}
