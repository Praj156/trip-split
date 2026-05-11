'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveExpenses } from '@/app/actions/sharing';

interface Member {
  id: string;
  name: string;
}

interface Expense {
  amount: number;
  description: string;
  sharedWithIds: string[];
}

interface MemberExpenseData {
  memberId: string;
  name: string;
  expenses: Expense[];
}

export default function SharingForm({ 
  tripId, 
  members 
}: { 
  tripId: string; 
  members: Member[] 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Initialize: each member gets one empty expense shared with everyone
  const [data, setData] = useState<MemberExpenseData[]>(
    members.map(m => ({
      memberId: m.id,
      name: m.name,
      expenses: [{
        amount: 0,
        description: '',
        sharedWithIds: members.map(all => all.id)
      }]
    }))
  );

  const addExpenseRow = (memberIndex: number) => {
    const newData = [...data];
    newData[memberIndex].expenses.push({
      amount: 0,
      description: '',
      sharedWithIds: members.map(all => all.id)
    });
    setData(newData);
  };

  const removeExpenseRow = (memberIndex: number, expenseIndex: number) => {
    const newData = [...data];
    if (newData[memberIndex].expenses.length > 1) {
      newData[memberIndex].expenses.splice(expenseIndex, 1);
      setData(newData);
    }
  };

  const updateField = (mIdx: number, eIdx: number, field: string, value: any) => {
    const newData = [...data];
    (newData[mIdx].expenses[eIdx] as any)[field] = value;
    setData(newData);
  };

  const toggleMember = (mIdx: number, eIdx: number, memberId: string) => {
    const current = data[mIdx].expenses[eIdx].sharedWithIds;
    const next = current.includes(memberId)
      ? current.filter(id => id !== memberId)
      : [...current, memberId];
    updateField(mIdx, eIdx, 'sharedWithIds', next);
  };

  const toggleAllMembers = (mIdx: number, eIdx: number) => {
    const current = data[mIdx].expenses[eIdx].sharedWithIds;
    const allSelected = current.length === members.length;
    updateField(mIdx, eIdx, 'sharedWithIds', allSelected ? [] : members.map(m => m.id));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await saveExpenses(tripId, data);
      router.push(`/wizard/${tripId}/summary`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Check if at least one expense has amount > 0
  const hasValidExpense = data.some(m => 
    m.expenses.some(e => e.amount > 0)
  );

  return (
    <div className="space-y-6">

      {/* ── MEMBER EXPENSE CARDS ───────────────────────────── */}
      {data.map((memberData, mIdx) => (
        <div key={memberData.memberId} 
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          
          {/* Member header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">
                {memberData.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-black text-slate-900 text-base">{memberData.name}</h3>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {memberData.expenses.length} expense{memberData.expenses.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Expense rows */}
          <div className="space-y-4">
            {memberData.expenses.map((expense, eIdx) => (
              <div key={eIdx} 
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                
                {/* Amount & Description */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={expense.amount || ''}
                      onChange={e => updateField(mIdx, eIdx, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                      Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dinner, Fuel"
                      value={expense.description}
                      onChange={e => updateField(mIdx, eIdx, 'description', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>

                {/* Shared with selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Shared With
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleAllMembers(mIdx, eIdx)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      {expense.sharedWithIds.length === members.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {members.map(member => {
                      const isSelected = expense.sharedWithIds.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => toggleMember(mIdx, eIdx, member.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2
                            ${isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                          {member.name}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Split amount preview */}
                  {expense.amount > 0 && expense.sharedWithIds.length > 0 && (
                    <p className="text-xs text-slate-500 font-medium mt-2">
                      Split: {(expense.amount / expense.sharedWithIds.length).toFixed(2)} per person
                    </p>
                  )}
                </div>

                {/* Remove expense button */}
                {memberData.expenses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExpenseRow(mIdx, eIdx)}
                    className="text-xs font-bold text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <span>×</span> Remove this expense
                  </button>
                )}
              </div>
            ))}

            {/* Add another expense for this member */}
            <button
              type="button"
              onClick={() => addExpenseRow(mIdx)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-bold text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all"
            >
              + Add Another Expense for {memberData.name}
            </button>
          </div>

        </div>
      ))}

      {/* ── SUBMIT ACTIONS ─────────────────────────────────── */}
      <div className="space-y-2.5 pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!hasValidExpense || loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all
            ${hasValidExpense && !loading
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
              Calculating...
            </span>
          ) : (
            'Calculate Settlement →'
          )}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full py-2.5 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
        >
          ← Back to Trip Details
        </button>
      </div>

      {/* Helper hint */}
      {!hasValidExpense && (
        <p className="text-xs text-center text-slate-400 font-medium">
          Add at least one expense with an amount to continue.
        </p>
      )}

    </div>
  );
}
