'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { lookupAccount } from '@/app/actions/account';
import { isValidEmail, normalizeEmail } from '@/lib/validation';
import { AuthCard, FormMessage, inputClass, labelClass, linkClass, primaryButtonClass } from '@/app/components/AuthCard';

type Outcome = null | { kind: 'sent' | 'none' | 'unconfirmed'; email: string };

export default function ForgotPasswordForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOutcome(null);
    if (!isValidEmail(email)) return setError('Enter a valid email address, like name@example.com.');
    const clean = normalizeEmail(email);
    setLoading(true);

    try {
      const status = await lookupAccount(clean);
      if (status === 'none') {
        // Nothing is sent for emails without an account.
        setOutcome({ kind: 'none', email: clean });
        return;
      }
      if (status === 'unconfirmed') {
        await createClient().auth.resend({
          type: 'signup',
          email: clean,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
        });
        setOutcome({ kind: 'unconfirmed', email: clean });
        return;
      }

      const { error } = await createClient().auth.resetPasswordForEmail(clean, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (!error) {
        setOutcome({ kind: 'sent', email: clean });
      } else if (error.status === 429 || /rate limit/i.test(error.message)) {
        setError('Too many reset emails were requested. Wait a few minutes and try again.');
      } else if (/redirect/i.test(error.message)) {
        setError('The reset link could not be created because this site’s address is not allowed in Supabase (Authentication → URL Configuration).');
      } else {
        setError(`The reset email could not be sent (${error.message}). Try again later.`);
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle={outcome?.kind === 'sent' ? undefined : 'Enter the email you signed up with and we’ll send you a reset link.'}
      footer={<Link href="/sign-in" className={linkClass}>Back to sign in</Link>}
    >
      {outcome?.kind === 'sent' ? (
        <div className="space-y-3">
          <FormMessage kind="success">
            We sent a password reset link to <strong>{outcome.email}</strong>. It can take a few minutes, so check your spam
            folder too.
          </FormMessage>
          <button type="button" onClick={() => setOutcome(null)} className={`${linkClass} text-[0.9375rem]`}>
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className={labelClass}>Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); setOutcome(null); }}
              placeholder="you@example.com"
              required
              className={inputClass}
            />
          </div>
          {error && <FormMessage kind="error">{error}</FormMessage>}
          {outcome?.kind === 'none' && (
            <FormMessage kind="info">
              There’s no TripSplit account for <strong>{outcome.email}</strong>, so no email was sent. Check the spelling, or{' '}
              <Link href="/sign-up" className={linkClass}>create an account</Link>.
            </FormMessage>
          )}
          {outcome?.kind === 'unconfirmed' && (
            <FormMessage kind="info">
              <strong>{outcome.email}</strong> was registered but never confirmed. We sent a new confirmation link; open it
              to activate your account.
            </FormMessage>
          )}
          <button type="submit" disabled={loading} className={primaryButtonClass}>
            {loading ? 'Checking…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
