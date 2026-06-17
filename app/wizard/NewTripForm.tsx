'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createTripWithMembers, updateTripWithMembers } from '../actions/trip';

interface Member {
  id: number;
  name: string;
}

export default function NewTripForm({ 
  defaultCurrency = 'AED',
  tripId,
  initialData
}: { 
  defaultCurrency?: string;
  tripId?: string;
  initialData?: {
    name: string;
    startDate: string;
    endDate: string;
    currency: string;
    members: Member[];
  }
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState('');
  const [memberError, setMemberError] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const memberInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    currency: initialData?.currency || defaultCurrency,
  });

  const [isMultiDay, setIsMultiDay] = useState(
    initialData ? initialData.startDate !== initialData.endDate : false
  );

  const [members, setMembers] = useState<Member[]>(initialData?.members || []);
  const nextId = useRef(initialData?.members ? Math.max(...initialData.members.map(m => m.id)) + 1 : 1);

  // Real-time date validation
  useEffect(() => {
    if (isMultiDay && formData.startDate && formData.endDate) {
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
  }, [formData.startDate, formData.endDate, isMultiDay]);

  // Sync end date with start date if not multi-day
  useEffect(() => {
    if (!isMultiDay && formData.startDate) {
      setFormData(prev => ({ ...prev, endDate: prev.startDate }));
    }
  }, [isMultiDay, formData.startDate]);

  const addMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;

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

    if (isMultiDay && formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start > end) {
        setDateError('Please fix the dates before continuing.');
        return;
      }
    }

    if (members.length < 2) {
      setMemberError('Please add at least 2 members.');
      return;
    }

    setLoading(true);
    setMemberError('');
    
    try {
      if (tripId) {
        await updateTripWithMembers({
          tripId,
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          currency: formData.currency,
          memberNames: members.map(m => m.name),
        });
        router.push(`/wizard/${tripId}/sharing`);
      } else {
        const newTripId = await createTripWithMembers({
          name: formData.name,
          startDate: formData.startDate,
          endDate: formData.endDate,
          currency: formData.currency,
          memberNames: members.map(m => m.name),
        });
        router.push(`/wizard/${newTripId}/sharing`);
      }
    } catch (err: any) {
      console.error(err);
      setMemberError(err.message || 'An error occurred while saving.');
      setLoading(false);
    }
  };

  const canSubmit = !dateError && formData.name && formData.startDate && formData.endDate && members.length >= 2;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── TRIP DETAILS CARD ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trip Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Trip Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Trip Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Goa Trip, Team Offsite, NYE Weekend"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Currency */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Currency</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
            >
              <option value="AED">AED (Dirham)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
              <option value="INR">INR (Indian Rupee)</option>
              <option value="AUD">AUD (Australian Dollar)</option>
              <option value="CAD">CAD (Canadian Dollar)</option>
            </select>
          </div>
        </div>

        {/* Multi-day Toggle */}
        <div className="flex items-center justify-between py-2">
          <label className="text-sm font-bold text-slate-700 cursor-pointer select-none">Multi-day trip</label>
          <div 
            onClick={() => setIsMultiDay(!isMultiDay)}
            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${isMultiDay ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isMultiDay ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Dates */}
        <div className={`grid ${isMultiDay ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">{isMultiDay ? 'From' : 'Date'}</label>
            <input
              required
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none transition-all
                ${dateError ? 'border-red-400 ring-2 ring-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
            />
          </div>
          {isMultiDay && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">To</label>
              <input
                required
                type="date"
                min={formData.startDate}
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border text-sm font-bold text-slate-900 outline-none transition-all
                  ${dateError ? 'border-red-400 ring-2 ring-red-50' : 'border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
              />
            </div>
          )}
        </div>

        {/* Date error */}
        {dateError && (
          <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5 pt-1">
            <span>⚠</span> {dateError}
          </p>
        )}
      </div>

      {/* ── MEMBERS CARD ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-1">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Members</h2>
          {members.length > 0 && (
            <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100/30 px-2.5 py-0.5 rounded-full">
              {members.length} added
            </span>
          )}
        </div>

        {/* Add member input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
            Add Participant Name
          </label>
          <div className="flex gap-2">
            <input
              ref={memberInputRef}
              type="text"
              placeholder="Name or group (e.g. Raj, Team A)"
              value={newMemberName}
              onChange={e => { setNewMemberName(e.target.value); setMemberError(''); }}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <button
              type="button"
              onClick={addMember}
              disabled={!newMemberName.trim()}
              className="px-5 py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-indigo-100 active:translate-y-0.5"
            >
              Add
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 font-bold -mt-1">
          💡 Press Enter to quickly add multiple members.
        </p>

        {/* Member list */}
        {members.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {members.map(m => (
              <div key={m.id}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-slate-50/50 border border-slate-200/60 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                    {m.name.charAt(0)}
                  </div>
                  <span className="text-sm font-extrabold text-slate-800">{m.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center text-base font-black transition-all"
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
          <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5 pt-1">
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
      <div className="space-y-2.5 pt-2">
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
            ${canSubmit && !loading
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 hover:-translate-y-0.5 cursor-pointer active:translate-y-0'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {tripId ? 'Updating trip...' : 'Creating trip...'}
            </span>
          ) : (
            'Continue to Expenses & Sharing →'
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full py-3 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>

    </form>
  );
}
