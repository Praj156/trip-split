'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ui } from '@/app/components/ui';
import { passwordProblem } from '@/lib/validation';
import { PasswordRules } from '@/app/components/PasswordRules';

export default function UpdatePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    const problem = passwordProblem(newPassword);
    if (problem) {
      setError(problem);
      return;
    }
    if (newPassword === currentPassword) {
      setError('Choose a new password that is different from your current one.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The two new passwords don’t match.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: meErr,
      } = await supabase.auth.getUser();

      if (meErr || !user?.email) {
        setError('Unable to get user email.');
        setLoading(false);
        return;
      }

      // Re-authenticate by signing in with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setError('Current password is incorrect');
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) {
        setError(updateErr.message || 'Failed to update password');
        setLoading(false);
        return;
      }

      // Best practice: sign the user out so they sign in with new password
      await supabase.auth.signOut();
      setMessage('Password updated. Please sign in with your new password.');
      setLoading(false);
      router.push('/sign-in');
    } catch {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
    <div className="max-w-md space-y-5">
      <div>
        <Link href="/profile" className="inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 3L4.5 7l4 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Profile
        </Link>
        <h1 className={`${ui.pageTitle} mt-2`}>Change password</h1>
        <p className="text-sm text-ink-2 mt-1">Confirm your current password, then choose a new one.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className={`${ui.card} p-4 sm:p-5 space-y-4`}>
        <div>
          <label htmlFor="current-password" className={ui.label}>Current password</label>
          <input id="current-password" required type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); setError(''); }} className={ui.input} />
        </div>
        <div>
          <label htmlFor="new-password" className={ui.label}>New password</label>
          <input id="new-password" required type="password" autoComplete="new-password" maxLength={72} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }} className={ui.input} aria-describedby="password-rules" />
          <PasswordRules value={newPassword} id="password-rules" />
        </div>
        <div>
          <label htmlFor="confirm-password" className={ui.label}>Confirm new password</label>
          <input id="confirm-password" required type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }} className={ui.input} />
        </div>

        {error && <p role="alert" className="text-sm font-semibold text-danger">{error}</p>}
        {message && <p className="text-sm font-semibold text-teal">{message}</p>}

        <button type="submit" disabled={loading} className={`${ui.btnPrimary} w-full`}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
    </div>
  );
}
