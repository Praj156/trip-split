'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateProfile } from '../actions/user';
import { CURRENCIES } from '@/lib/validation';
import { ui } from '@/app/components/ui';

export default function ProfileForm({ initialData }: { initialData: { name: string; defaultCurrency: string; email: string } }) {
  const [name, setName] = useState(initialData.name);
  const [currency, setCurrency] = useState(initialData.defaultCurrency);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await updateProfile({ name, defaultCurrency: currency });
      if (!res.ok) setError(res.error);
      else {
        setMessage('Profile saved.');
        router.refresh();
      }
    } catch {
      setError('Could not save your profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className={`${ui.card} p-4 sm:p-5 space-y-4`} aria-labelledby="general-heading">
        <h2 id="general-heading" className={ui.sectionTitle}>Account</h2>
        <div>
          <label htmlFor="profile-email" className={ui.label}>Email</label>
          <input id="profile-email" type="email" disabled value={initialData.email} className={ui.input} />
          <p className={ui.hint}>Your sign-in email can&apos;t be changed here.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profile-name" className={ui.label}>Your name</label>
            <input
              id="profile-name"
              type="text"
              maxLength={60}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); setMessage(''); }}
              placeholder="e.g. Priya Sharma"
              className={ui.input}
            />
          </div>
          <div>
            <label htmlFor="profile-currency" className={ui.label}>Default currency</label>
            <select id="profile-currency" value={currency} onChange={(e) => { setCurrency(e.target.value); setError(''); setMessage(''); }} className={ui.input}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} ({c.label})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className={ui.btnPrimary}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <p aria-live="polite" className={`text-sm font-semibold ${error ? 'text-danger' : 'text-teal'}`}>
            {error || message}
          </p>
        </div>
      </form>

      <section className={`${ui.card} p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3`} aria-labelledby="security-heading">
        <div>
          <h2 id="security-heading" className={ui.sectionTitle}>Password</h2>
          <p className="text-sm text-ink-2">Change the password you use to sign in.</p>
        </div>
        <Link href="/profile/update-password" className={ui.btnSecondary}>
          Change password
        </Link>
      </section>
    </div>
  );
}
