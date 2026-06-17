'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
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
    } catch (err) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
          Update Password
        </h1>
        <p className="text-sm text-slate-500 font-medium">For security, please verify your current password before changing it.</p>
        <div>
          <Link href="/profile" className="text-xs font-bold text-indigo-600 hover:underline">
            ← Back to Profile Settings
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Current Password</label>
            <input
              required
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">New Password</label>
            <input
              required
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Confirm New Password</label>
            <input
              required
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
          {message && <p className="text-xs font-semibold text-green-600">{message}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
