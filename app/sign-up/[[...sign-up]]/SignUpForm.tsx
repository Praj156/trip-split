'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { lookupAccount } from '@/app/actions/account';
import { isValidEmail, normalizeEmail, passwordProblem } from '@/lib/validation';
import { PasswordRules } from '@/app/components/PasswordRules';
import { AuthCard, FormMessage, inputClass, labelClass, linkClass, primaryButtonClass } from '@/app/components/AuthCard';

type Problem = { kind: 'error'; text: string } | { kind: 'exists'; email: string } | null;

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<Problem>(null);
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState<{ to: string; resent: boolean } | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  // Typing a password hides a password error; the "already registered" help stays until the email changes.
  const clearPasswordProblem = () => setProblem((p) => (p?.kind === 'error' ? null : p));
  const router = useRouter();

  const checkEmail = () => {
    const ok = isValidEmail(email);
    setEmailError(email && !ok ? 'Enter a valid email address, like name@example.com.' : '');
    return ok;
  };

  const resend = async (to: string) => {
    setResendState('sending');
    const { error } = await createClient().auth.resend({
      type: 'signup',
      email: to,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    setResendState(error ? 'failed' : 'sent');
    return !error;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setProblem(null);
    if (!checkEmail()) return setEmailError('Enter a valid email address, like name@example.com.');
    const pwProblem = passwordProblem(password);
    if (pwProblem) return setProblem({ kind: 'error', text: pwProblem });
    if (password !== confirmPassword) return setProblem({ kind: 'error', text: 'The two passwords don’t match.' });

    const cleanEmail = normalizeEmail(email);
    setLoading(true);
    try {
      const status = await lookupAccount(cleanEmail);
      if (status === 'confirmed') {
        setProblem({ kind: 'exists', email: cleanEmail });
        setLoading(false);
        return;
      }
      if (status === 'unconfirmed') {
        // Signed up before but never confirmed: send the confirmation again.
        await resend(cleanEmail);
        setSent({ to: cleanEmail, resent: true });
        setLoading(false);
        return;
      }

      const { data, error } = await createClient().auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
      });
      if (error) {
        if (error.code === 'user_already_exists' || /already registered/i.test(error.message)) {
          setProblem({ kind: 'exists', email: cleanEmail });
        } else if (error.status === 429 || /rate limit/i.test(error.message)) {
          setProblem({ kind: 'error', text: 'Too many sign-up emails were sent recently. Wait a few minutes and try again.' });
        } else {
          setProblem({ kind: 'error', text: `We couldn’t create your account: ${error.message}` });
        }
        setLoading(false);
        return;
      }
      // Supabase hides existing accounts by returning a user with no identities.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setProblem({ kind: 'exists', email: cleanEmail });
        setLoading(false);
        return;
      }
      if (!data.session) {
        setSent({ to: cleanEmail, resent: false });
        setLoading(false);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setProblem({ kind: 'error', text: 'Could not reach the server. Check your connection and try again.' });
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthCard title="Confirm your email" footer={<Link href="/sign-in" className={linkClass}>Back to sign in</Link>}>
        <FormMessage kind="success">
          {sent.resent ? 'This email was registered but never confirmed, so we sent a new confirmation link to ' : 'We sent a confirmation link to '}
          <strong>{sent.to}</strong>. Open it to activate your account and you’ll be signed straight in.
        </FormMessage>
        <p className="text-[0.9375rem] text-ink-2 mt-4">Can’t find it? It can take a few minutes; check your spam folder too.</p>
        <button
          type="button"
          disabled={resendState === 'sending' || resendState === 'sent'}
          onClick={() => resend(sent.to)}
          className={`${linkClass} mt-3 text-[0.9375rem] disabled:opacity-60 disabled:no-underline`}
        >
          {resendState === 'sending' ? 'Sending…' : resendState === 'sent' ? 'Sent again' : 'Send the link again'}
        </button>
        {resendState === 'failed' && (
          <p role="alert" className="text-sm text-danger mt-2">Couldn’t resend right now. Wait a minute and try again.</p>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="You'll create trips and invite the members. They won't need an account."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/sign-in" className={linkClass}>Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSignUp} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(''); setProblem(null); }}
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
          <label htmlFor="password" className={labelClass}>Password</label>
          <input id="password" type="password" autoComplete="new-password" maxLength={72} value={password} onChange={(e) => { setPassword(e.target.value); clearPasswordProblem(); }} required className={inputClass} aria-describedby="password-rules" />
          <PasswordRules value={password} id="password-rules" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClass}>Confirm password</label>
          <input id="confirmPassword" type="password" autoComplete="new-password" maxLength={72} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); clearPasswordProblem(); }} required className={inputClass} />
          {confirmPassword && confirmPassword !== password && (
            <p className="text-sm text-danger mt-1">The two passwords don’t match yet.</p>
          )}
        </div>

        {problem?.kind === 'error' && <FormMessage kind="error">{problem.text}</FormMessage>}
        {problem?.kind === 'exists' && (
          <FormMessage kind="info">
            <strong>{problem.email}</strong> already has a TripSplit account.{' '}
            <Link href={`/sign-in?email=${encodeURIComponent(problem.email)}`} className={linkClass}>Sign in instead</Link>
            {' '}or{' '}
            <Link href={`/forgot-password?email=${encodeURIComponent(problem.email)}`} className={linkClass}>reset your password</Link>.
          </FormMessage>
        )}

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthCard>
  );
}
