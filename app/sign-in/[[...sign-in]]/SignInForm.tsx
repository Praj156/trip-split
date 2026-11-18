'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
import { AuthCard, FormMessage, inputClass, labelClass, linkClass, primaryButtonClass } from '@/app/components/AuthCard';

export default function SignInForm({ next, linkError, initialEmail }: { next: string; linkError: boolean; initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState<string | null>(
    linkError ? 'That link has expired or was already used. Sign in, or request a new link.' : null,
  );
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const router = useRouter();

  const checkEmail = () => {
    const ok = isValidEmail(email);
    setEmailError(email && !ok ? 'Enter a valid email address, like name@example.com.' : '');
    return ok;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnconfirmed(false);
    if (!checkEmail()) return setEmailError('Enter a valid email address, like name@example.com.');
    if (!password) return setError('Enter your password.');
    setLoading(true);

    try {
      const { error } = await createClient().auth.signInWithPassword({ email: normalizeEmail(email), password });
      if (error) {
        if (error.code === 'email_not_confirmed') {
          setUnconfirmed(true);
        } else if (error.code === 'invalid_credentials') {
          setError('That email and password don’t match. Check them and try again.');
        } else if (error.status === 429) {
          setError('Too many attempts. Wait a minute and try again.');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setLoading(false);
    }
  };

  const resend = async () => {
    setResendState('sending');
    const { error } = await createClient().auth.resend({
      type: 'signup',
      email: normalizeEmail(email),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    setResendState(error ? 'failed' : 'sent');
  };

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back. Pick up where your group left off."
      footer={
        <>
          New to TripSplit?{' '}
          <Link href="/sign-up" className={linkClass}>Create an account</Link>
        </>
      }
    >
      <form onSubmit={handleSignIn} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); setError(null); setUnconfirmed(false); }}
            onBlur={checkEmail}
            placeholder="you@example.com"
            required
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            className={`${inputClass} ${emailError ? 'border-danger' : ''}`}
          />
          {emailError && <p id="email-error" className="text-sm text-danger mt-1">{emailError}</p>}
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className={labelClass}>Password</label>
            <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`} className={`text-sm ${linkClass}`}>
              Forgot password?
            </Link>
          </div>
          <input id="password" type="password" autoComplete="current-password" maxLength={72} value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} required className={inputClass} />
        </div>

        {error && <FormMessage kind="error">{error}</FormMessage>}
        {unconfirmed && (
          <FormMessage kind="info">
            You haven’t confirmed this email yet. Open the link we sent when you signed up.{' '}
            {resendState === 'sent' ? (
              <strong>New link sent.</strong>
            ) : (
              <button type="button" onClick={resend} disabled={resendState === 'sending'} className={linkClass}>
                {resendState === 'sending' ? 'Sending…' : 'Send it again'}
              </button>
            )}
            {resendState === 'failed' && <span className="block text-danger mt-1">Couldn’t resend right now. Wait a minute and try again.</span>}
          </FormMessage>
        )}

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthCard>
  );
}
