'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createTripWithMembers, updateTripWithMembers } from '../actions/trip';
import { CURRENCIES, DATE_MAX, DATE_MIN, hasLetterOrDigit, isDateInRange, LIMITS } from '@/lib/validation';
import { Avatar, ui } from '@/app/components/ui';

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
  const [submitError, setSubmitError] = useState('');
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
  const nextId = useRef(initialData?.members?.length ? Math.max(...initialData.members.map(m => m.id)) + 1 : 1);

  // Derived, so it is always in sync with the inputs.
  const badDate = (v: string) => v !== '' && !isDateInRange(v);
  const dateError =
    badDate(formData.startDate) || (isMultiDay && badDate(formData.endDate))
      ? 'Enter a real date between 2000 and 2100.'
      : isMultiDay && formData.startDate && formData.endDate && formData.startDate > formData.endDate
        ? 'End date must be on or after the start date.'
        : '';
  const nameError =
    formData.name.trim() && !hasLetterOrDigit(formData.name) ? 'Use at least one letter or number in the trip name.' : '';

  const setStartDate = (startDate: string) =>
    setFormData((prev) => ({ ...prev, startDate, endDate: isMultiDay ? prev.endDate : startDate }));

  const toggleMultiDay = () => {
    setIsMultiDay((multi) => {
      if (multi) setFormData((prev) => ({ ...prev, endDate: prev.startDate }));
      return !multi;
    });
  };

  const addMember = () => {
    const trimmed = newMemberName.replace(/\s+/g, ' ').trim();
    if (!trimmed) return;
    if (!hasLetterOrDigit(trimmed)) {
      setMemberError('A member name needs at least one letter or number.');
      return;
    }
    if (members.length >= LIMITS.members) {
      setMemberError(`A trip can have up to ${LIMITS.members} members.`);
      return;
    }

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
    if (dateError || nameError) return;

    // Include a name that was typed but not yet added.
    let list = members;
    const pending = newMemberName.trim();
    if (pending && hasLetterOrDigit(pending) && !members.some((m) => m.name.toLowerCase() === pending.toLowerCase())) {
      list = [...members, { id: nextId.current++, name: pending }];
      setMembers(list);
      setNewMemberName('');
    }

    if (list.length < 2) {
      setMemberError('Please add at least 2 members.');
      return;
    }

    setLoading(true);
    setMemberError('');
    setSubmitError('');

    const payload = {
      name: formData.name,
      startDate: formData.startDate,
      endDate: isMultiDay ? formData.endDate : formData.startDate,
      currency: formData.currency,
      memberNames: list.map((m) => m.name),
    };

    try {
      const result = tripId
        ? await updateTripWithMembers({ tripId, ...payload })
        : await createTripWithMembers(payload);
      if (!result.ok) {
        setSubmitError(result.error);
        setLoading(false);
        return;
      }
      const id = tripId ?? (result.data as string);
      router.push(`/wizard/${id}/sharing`);
    } catch {
      setSubmitError('Could not save the trip. Check your connection and try again.');
      setLoading(false);
    }
  };

  const pendingCount = newMemberName.trim() ? 1 : 0;
  const canSubmit = !dateError && !nameError && formData.name.trim() && formData.startDate && (!isMultiDay || formData.endDate) && members.length + pendingCount >= 2;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid lg:grid-cols-2 gap-4 items-start">
      <section className={`${ui.card} p-4 sm:p-5 space-y-4`} aria-labelledby="details-heading">
        <h2 id="details-heading" className={ui.sectionTitle}>Trip details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] lg:grid-cols-[1fr_210px] gap-4">
          <div>
            <label htmlFor="trip-name" className={ui.label}>Trip name</label>
            <input
              id="trip-name"
              required
              type="text"
              maxLength={80}
              placeholder="e.g. Goa trip, team offsite"
              value={formData.name}
              onChange={(e) => { setFormData((prev) => ({ ...prev, name: e.target.value })); setSubmitError(''); }}
              className={ui.input}
            />
            {nameError && <p role="alert" className="text-sm text-danger mt-1">{nameError}</p>}
          </div>
          <div>
            <label htmlFor="trip-currency" className={ui.label}>Currency</label>
            <select
              id="trip-currency"
              value={formData.currency}
              onChange={(e) => { setFormData((prev) => ({ ...prev, currency: e.target.value })); setSubmitError(''); }}
              className={ui.input}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} ({c.label})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span id="multi-day-label" className="text-sm font-semibold text-navy">Multi-day trip</span>
          <button
            type="button"
            role="switch"
            aria-checked={isMultiDay}
            aria-labelledby="multi-day-label"
            onClick={toggleMultiDay}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isMultiDay ? 'bg-teal' : 'bg-line-2'}`}
          >
            <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${isMultiDay ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className={`grid gap-4 ${isMultiDay ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <div>
            <label htmlFor="trip-start" className={ui.label}>{isMultiDay ? 'From' : 'Date'}</label>
            <input
              id="trip-start"
              required
              type="date"
              min={DATE_MIN}
              max={DATE_MAX}
              value={formData.startDate}
              onChange={(e) => { setStartDate(e.target.value); setSubmitError(''); }}
              aria-invalid={!!dateError}
              className={`${ui.input} ${dateError ? 'border-red-500' : ''}`}
            />
          </div>
          {isMultiDay && (
            <div>
              <label htmlFor="trip-end" className={ui.label}>To</label>
              <input
                id="trip-end"
                required
                type="date"
                min={formData.startDate || DATE_MIN}
                max={DATE_MAX}
                value={formData.endDate}
                onChange={(e) => { setFormData((prev) => ({ ...prev, endDate: e.target.value })); setSubmitError(''); }}
                aria-invalid={!!dateError}
                className={`${ui.input} ${dateError ? 'border-red-500' : ''}`}
              />
            </div>
          )}
        </div>
        {dateError && <p role="alert" className="text-sm font-semibold text-danger">{dateError}</p>}
      </section>

      <section className={`${ui.card} p-4 sm:p-5 space-y-3`} aria-labelledby="members-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="members-heading" className={ui.sectionTitle}>Members</h2>
          <span className="text-sm text-ink-2">{members.length} added</span>
        </div>

        <div>
          <label htmlFor="member-name" className={ui.label}>Add a member</label>
          <div className="flex gap-2">
            <input
              id="member-name"
              ref={memberInputRef}
              type="text"
              maxLength={40}
              placeholder="e.g. Raj, or the Sharma family"
              value={newMemberName}
              onChange={(e) => { setNewMemberName(e.target.value); setMemberError(''); setSubmitError(''); }}
              onKeyDown={handleKeyDown}
              className={`${ui.input} flex-1 min-w-0`}
            />
            <button type="button" onClick={addMember} disabled={!newMemberName.trim()} className={ui.btnSecondary}>
              Add
            </button>
          </div>
          <p className={ui.hint}>A member can be one person or a whole family or group. Press Enter to add several quickly.</p>
        </div>

        {members.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Members">
            {members.map((m) => (
              <li key={m.id} className="inline-flex items-center gap-1.5 h-9 pl-1.5 pr-1 rounded-full bg-sky border border-line">
                <Avatar name={m.name} size="sm" />
                <span className="text-sm font-semibold text-navy max-w-[14rem] truncate">{m.name}</span>
                <button
                  type="button"
                  onClick={() => removeMember(m.id)}
                  aria-label={`Remove ${m.name}`}
                  className="w-7 h-7 rounded-full text-ink-3 hover:text-danger hover:bg-red-50 inline-flex items-center justify-center"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {memberError && <p role="alert" className="text-sm font-semibold text-danger">{memberError}</p>}
        {members.length < 2 && !memberError && (
          <p className="text-sm text-ink-2">Add at least 2 members to continue.</p>
        )}
      </section>

      </div>

      {submitError && (
        <p role="alert" className="text-sm font-semibold text-danger bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {submitError}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <button type="button" onClick={() => router.back()} className={ui.btnGhost}>
          Cancel
        </button>
        <button type="submit" disabled={!canSubmit || loading} className={ui.btnPrimary}>
          {loading ? (tripId ? 'Saving…' : 'Creating trip…') : tripId ? 'Save and continue to expenses' : 'Continue to expenses'}
        </button>
      </div>
    </form>
  );
}
