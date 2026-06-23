'use client';

import { useState } from 'react';
import { updateProfile } from '../actions/user';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfileForm({ initialData }: { initialData: { name: string; defaultCurrency: string; email: string } }) {
  const [name, setName] = useState(initialData.name);
  const [currency, setCurrency] = useState(initialData.defaultCurrency);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const router = useRouter();

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileMessage('');

    try {
      await updateProfile({ name, defaultCurrency: currency });
      setProfileMessage('Profile updated successfully.');
      router.refresh();
    } catch (err) {
      setProfileError('Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">General Settings</h2>
        
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Email (Read Only)</label>
            <input
              type="email"
              disabled
              value={initialData.email}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Default Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
            >
              <option value="AED">AED (Emirati Dirham)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
              <option value="INR">INR (Indian Rupee)</option>
              <option value="AUD">AUD (Australian Dollar)</option>
              <option value="CAD">CAD (Canadian Dollar)</option>
            </select>
          </div>

          {profileError && <p className="text-xs font-semibold text-red-500">{profileError}</p>}
          {profileMessage && <p className="text-xs font-semibold text-green-600">{profileMessage}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Security Settings Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Security</h2>
          <p className="text-xs text-slate-400 font-bold mt-1">Manage your password and authentication settings.</p>
        </div>
        <div className="pt-2">
          <Link
            href="/profile/update-password"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            🔑 Change Password
          </Link>
        </div>
      </div>
    </div>
  );
}
