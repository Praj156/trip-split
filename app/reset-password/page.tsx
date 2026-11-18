'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { passwordProblem } from '@/lib/validation';
import { PasswordRules } from '@/app/components/PasswordRules';
import { AuthCard, FormMessage, inputClass, labelClass, linkClass, primaryButtonClass } from '@/app/components/AuthCard';

export default function ResetPasswordPage() {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkExpired, setLinkExpired] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const fromEmailLink = url.searchParams.has('code') || url.hash.includes('type=recovery');
    // /auth/confirm sends people here with ?error=link when the link has expired or was used.
    const expired = url.searchParams.get('error') === 'link';

    // The browser client exchanges the link's code for a session on load.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session || fromEmailLink) setShowForm(true);
      else if (expired) setLinkExpired(true);
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setShowForm(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirmPassword) return setError('The two passwords don’t match.');

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(
          error.code === 'same_password'
            ? 'Choose a password different from your current one.'
            : error.message.includes('session')
              ? 'This reset link has expired. Request a new one.'
              : error.message,
        );
        setLoading(false);
        return;
      }
      // Sign out so the new password is used from here on.
      await supabase.auth.signOut();
      setMessage('Password updated. Taking you to sign in…');
      setTimeout(() => router.push('/sign-in'), 1500);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Choose a new password"
      footer={<Link href="/forgot-password" className={linkClass}>Request a new reset link</Link>}
    >
      {!showForm ? (
        linkExpired ? (
          <FormMessage kind="error">
            That reset link has expired or was already used. Request a new one below.
          </FormMessage>
        ) : (
          <FormMessage kind="info">
            Open the reset link from your email to set a new password. Links expire after a short time.
          </FormMessage>
        )
      ) : (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="password" className={labelClass}>New password</label>
            <input id="password" type="password" autoComplete="new-password" maxLength={72} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} required className={inputClass} aria-describedby="password-rules" />
            <PasswordRules value={password} id="password-rules" />
          </div>
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>Confirm new password</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }} required className={inputClass} />
          </div>
          {error && <FormMessage kind="error">{error}</FormMessage>}
          {message && <FormMessage kind="success">{message}</FormMessage>}
          <button type="submit" disabled={loading || !!message} className={primaryButtonClass}>
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
