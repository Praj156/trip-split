'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createTripWithMembers } from '../actions/trip';

interface Member {
  id: number;
  name: string;
}

export default function NewTripForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');
  const [memberError, setMemberError] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const memberInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });

  const [members, setMembers] = useState<Member[]>([]);
  const nextId = useRef(1);

  // Real-time date validation
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        setDateError('End date must be on or after the start date.');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  }, [formData.startDate, formData.endDate]);

  const addMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

    // Check for duplicate names (case-insensitive)
    if (members.some(m => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setMemberError('This name is already added.');
      return;
    }

    setMembers(prev => [...prev, { id: nextId.current++, name: trimmed }]);
    setNewMemberName('');
    setMemberError('');
    memberInputRef.current?.focus();
  };

  const removeMember = (id: number) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        setDateError('Please fix the dates before continuing.');
        return;
      }
    }

    // Validate members
    if (members.length < 2) {
      setMemberError('Please add at least 2 members.');
      return;
    }

    setLoading(true);
    try {
      const tripId = await createTripWithMembers({
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        memberNames: members.map(m => m.name),
      });
      router.push(`/wizard/${tripId}/sharing`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const canSubmit = !dateError && formData.name && formData.startDate && formData.endDate && members.length >= 2;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── TRIP DETAILS CARD ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Trip Details</h2>

        {/* Trip Name */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Trip Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Goa Trip, Team Offsite, NYE Weekend"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">From</label>
            <input
              required
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 outline-none transition-all
                ${dateError ? 'border-red-400 ring-2 ring-red-50' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">To</label>
            <input
              required
              type="date"
              min={formData.startDate}
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 outline-none transition-all
                ${dateError ? 'border-red-400 ring-2 ring-red-50' : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'}`}
            />
          </div>
        </div>

        {/* Date error */}
        {dateError && (
          <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
            <span>⚠</span> {dateError}
          </p>
        )}
      </div>

      {/* ── MEMBERS CARD ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Members</h2>
          {members.length > 0 && (
            <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
              {members.length} added
            </span>
          )}
        </div>

        {/* Add member input */}
        <div className="flex gap-2">
          <input
            ref={memberInputRef}
            type="text"
            placeholder="Name or group (e.g. Raj, Team A)"
            value={newMemberName}
            onChange={e => { setNewMemberName(e.target.value); setMemberError(''); }}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          <button
            type="button"
            onClick={addMember}
            disabled={!newMemberName.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Add
          </button>
        </div>

        <p className="text-[11px] text-slate-400 font-medium -mt-2">
          Press Enter to quickly add multiple members.
        </p>

        {/* Member list */}
        {members.length > 0 && (
          <div className="space-y-2">
            {members.map(m => (
              <div key={m.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{m.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="text-slate-300 hover:text-red-400 transition-colors font-bold text-base leading-none"
                  aria-label={`Remove ${m.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Member error */}
        {memberError && (
          <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
            <span>⚠</span> {memberError}
          </p>
        )}

        {/* Hint when empty */}
        {members.length === 0 && (
          <p className="text-xs text-slate-400 font-medium text-center py-2">
            Add at least 2 members to continue.
          </p>
        )}
      </div>

      {/* ── ACTIONS ────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all
            ${canSubmit && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 hover:-translate-y-0.5'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creating trip...
            </span>
          ) : (
            'Continue to Expenses & Sharing →'
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full py-2.5 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>

    </form>
  );
}
