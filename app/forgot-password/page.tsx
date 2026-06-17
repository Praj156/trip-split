'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { checkEmailExists } from '@/app/actions/user';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const exists = await checkEmailExists(email);
      if (!exists) {
        setError('No account found with this email address.');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSent(true);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="shadow-2xl border border-slate-200 rounded-2xl bg-white p-8 w-full max-w-md">
        <h1 className="text-gray-900 font-black text-2xl mb-2">Forgot Password</h1>
        <p className="text-gray-500 text-sm mb-6">Enter your account email to receive reset instructions</p>

        {!sent ? (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm normal-case disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send reset email'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              A password reset link has been successfully sent to <strong>{email}</strong>. Please check your inbox.
            </div>

            <p className="text-center text-sm text-gray-600 mt-2">
              <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-semibold">
                Back to sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
