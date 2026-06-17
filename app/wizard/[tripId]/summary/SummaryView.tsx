'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateTripStatus, deleteTrip } from '../../../actions/trip';

interface SerializedExpense {
  id: string;
  description: string;
  amount: number;
  sharedWithIds: string[];
  date: string;
}

interface SerializedMember {
  id: string;
  name: string;
  expenses: SerializedExpense[];
}

interface SerializedTrip {
  id: string;
  name: string;
  status: string;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  members: SerializedMember[];
}

export default function SummaryView({ trip }: { trip: SerializedTrip }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'settlements' | 'ledger' | 'stats'>('settlements');
  const [copied, setCopied] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    await updateTripStatus(trip.id, newStatus);
    router.refresh();
    setStatusUpdating(false);
  };

  const handleDeleteTrip = async () => {
    if (confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
      setIsDeleting(true);
      await deleteTrip(trip.id);
      router.push('/dashboard');
    }
  };

  // 1. Calculate stats
  const totalTripExpense = trip.members.reduce((acc, m) =>
    acc + m.expenses.reduce((sum, e) => sum + e.amount, 0), 0
  );

  const averagePerFamily = totalTripExpense / (trip.members.length || 1);

  // 2. Calculate Net Balances
  const balances: { [memberId: string]: number } = {};
  trip.members.forEach(m => balances[m.id] = 0);

  trip.members.forEach(member => {
    member.expenses.forEach(expense => {
      // The person who paid gets a credit
      balances[member.id] += expense.amount;

      // The cost is split among everyone in sharedWithIds
      if (expense.sharedWithIds.length > 0) {
        const splitAmount = expense.amount / expense.sharedWithIds.length;
        expense.sharedWithIds.forEach(id => {
          balances[id] -= splitAmount;
        });
      }
    });
  });

  // 3. Settlement Algorithm (Who pays whom)
  const debtors: { id: string; name: string; amount: number }[] = [];
  const creditors: { id: string; name: string; amount: number }[] = [];

  Object.entries(balances).forEach(([id, balance]) => {
    const name = trip.members.find(m => m.id === id)?.name || "Unknown";
    if (balance < -0.01) debtors.push({ id, name, amount: Math.abs(balance) });
    else if (balance > 0.01) creditors.push({ id, name, amount: balance });
  });

  const settlements: { from: string; to: string; amount: number }[] = [];
  let dIdx = 0;
  let cIdx = 0;

  // Make a copy of amounts to avoid mutating state values
  const workingDebtors = debtors.map(d => ({ ...d }));
  const workingCreditors = creditors.map(c => ({ ...c }));

  while (dIdx < workingDebtors.length && cIdx < workingCreditors.length) {
    const payment = Math.min(workingDebtors[dIdx].amount, workingCreditors[cIdx].amount);
    settlements.push({
      from: workingDebtors[dIdx].name,
      to: workingCreditors[cIdx].name,
      amount: payment
    });

    workingDebtors[dIdx].amount -= payment;
    workingCreditors[cIdx].amount -= payment;

    if (workingDebtors[dIdx].amount < 0.01) dIdx++;
    if (workingCreditors[cIdx].amount < 0.01) cIdx++;
  }

  // 4. Flatten all expenses for ledger
  const allExpenses = trip.members.flatMap(m =>
    m.expenses.map(e => ({
      id: e.id,
      description: e.description || 'General Expense',
      amount: e.amount,
      paidBy: m.name,
      paidById: m.id,
      date: new Date(e.date),
      sharedWith: e.sharedWithIds.map(id => trip.members.find(member => member.id === id)?.name || "Unknown")
    }))
  ).sort((a, b) => b.date.getTime() - a.date.getTime());

  // 5. Handle Copy Summary to Clipboard
  const handleCopySummary = () => {
    let report = `✈️ TRIP SPLIT SUMMARY: ${trip.name.toUpperCase()}\n`;
    if (trip.startDate && trip.endDate) {
      report += `📅 Date: ${new Date(trip.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(trip.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}\n`;
    }
    report += `💰 Total Trip Expense: ${totalTripExpense.toFixed(2)} ${trip.currency}\n`;
    report += `👥 Members: ${trip.members.length}\n`;
    report += `-------------------------------------------\n\n`;

    report += `📊 CONTRIBUTIONS:\n`;
    trip.members.forEach(m => {
      const spent = m.expenses.reduce((sum, e) => sum + e.amount, 0);
      report += `  - ${m.name}: ${spent.toFixed(2)} ${trip.currency}\n`;
    });
    report += `\n`;

    report += `💸 FINAL SETTLEMENTS (WHO PAYS WHOM):\n`;
    if (settlements.length > 0) {
      settlements.forEach(s => {
        report += `  ✅ ${s.from} pays ${s.to} ➜ ${s.amount.toFixed(2)} ${trip.currency}\n`;
      });
    } else {
      report += `  ✨ Everything is perfectly balanced! No payments needed.\n`;
    }
    report += `\nShared via TripSplit 🚀`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 print:py-4">
      {/* ── HEADER HERO ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 md:p-10 shadow-xl border border-slate-800 text-center">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-[-30%] left-[-10%] w-[300px] h-[300px] bg-teal-400/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          {/* Status Pill */}
          <div className="flex-shrink-0">
            <select
              value={trip.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border outline-none cursor-pointer transition-all appearance-none text-center ${
                trip.status === 'active' 
                  ? 'bg-teal-500/10 text-teal-300 border-teal-500/30 hover:bg-teal-500/25' 
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
              style={{ colorScheme: 'dark' }}
            >
              <option value="active" className="bg-slate-900 text-white">🌴 Active</option>
              <option value="completed" className="bg-slate-900 text-white">✅ Completed</option>
            </select>
          </div>

          {/* Trip Info */}
          <div className="space-y-1 max-w-xl">
            <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-tight">
              {trip.name}
            </h1>
            <p className="text-slate-300 font-bold text-xs uppercase tracking-wider">
              {trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
              {trip.endDate ? ` — ${new Date(trip.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            </p>
          </div>

          <div className="w-16 h-0.5 bg-indigo-500/30 rounded" />

          {/* Stats Grid */}
          <div className="flex flex-row items-center justify-center gap-8 md:gap-12 flex-wrap pt-2 w-full">
            <div className="text-center">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Trip Expense</p>
              <p className="text-3xl md:text-5xl font-black text-indigo-400 tracking-tight mt-1">
                {totalTripExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm md:text-base font-bold text-white">{trip.currency}</span>
              </p>
            </div>
            <div className="w-[1px] h-8 bg-slate-800 hidden sm:block" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Avg per Member</p>
              <p className="text-2xl md:text-3xl font-black text-teal-400 tracking-tight mt-1">
                {averagePerFamily.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs md:text-sm font-bold text-slate-300">{trip.currency}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS NAVIGATION ───────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex gap-1 print:hidden">
        <button
          onClick={() => setActiveTab('settlements')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'settlements'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          💸 Settle Balances
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'ledger'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          📝 Expense Ledger ({allExpenses.length})
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'stats'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          📊 Stats & Share
        </button>
      </div>

      {/* ── TAB CONTENT: SETTLEMENTS ───────────────────────────── */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">Final Payments</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Most efficient path to settle all debts</p>
              </div>
              <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full">
                Auto-calculated
              </span>
            </div>

            <div className="space-y-4">
              {settlements.length > 0 ? (
                settlements.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all">
                    {/* Debtor */}
                    <div className="flex items-center gap-3 w-1/3">
                      <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 border border-red-100/30 flex items-center justify-center text-xs font-black uppercase">
                        {s.from.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Debtor</span>
                        <span className="font-extrabold text-slate-800 text-sm md:text-base">{s.from}</span>
                      </div>
                    </div>

                    {/* Transfer Direction */}
                    <div className="flex flex-col items-center justify-center w-1/3 px-2">
                      <span className="text-slate-400 font-bold text-xs">pays</span>
                      <div className="w-full relative flex items-center justify-center my-1.5">
                        <div className="absolute w-full h-[2px] bg-dashed bg-slate-200" />
                        <span className="relative z-10 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-xs leading-none">
                          ➔
                        </span>
                      </div>
                      <span className="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-3 py-1 rounded-full text-xs md:text-sm">
                        {s.amount.toFixed(2)} {trip.currency}
                      </span>
                    </div>

                    {/* Creditor */}
                    <div className="flex items-center gap-3 w-1/3 justify-end text-right">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Recipient</span>
                        <span className="font-extrabold text-slate-800 text-sm md:text-base">{s.to}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/30 flex items-center justify-center text-xs font-black uppercase">
                        {s.to.charAt(0)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 space-y-3">
                  <span className="text-3xl">✨</span>
                  <p className="text-slate-500 font-bold text-sm">Everything is perfectly balanced!</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">No transactions are necessary; contributions are completely equal.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: EXPENSE LEDGER ────────────────────────── */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Trip Ledger</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Chronological record of all expenses paid</p>
            </div>

            <div className="divide-y divide-slate-100">
              {allExpenses.length > 0 ? (
                allExpenses.map((exp, i) => (
                  <div key={exp.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-sm md:text-base">{exp.description}</span>
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200/50 px-2 py-0.5 rounded">
                          {exp.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                        <span className="font-bold text-slate-500">Paid by:</span>
                        <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase text-[10px]">{exp.paidBy}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-bold text-slate-500">Shared with:</span>
                        <span className="font-bold text-slate-600">{exp.sharedWith.join(', ')}</span>
                      </div>
                    </div>

                    <div className="text-right flex items-center md:flex-col gap-2 md:gap-0.5 justify-between">
                      <span className="text-base font-black text-slate-800">
                        {exp.amount.toFixed(2)} {trip.currency}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        ({(exp.amount / exp.sharedWith.length).toFixed(2)} each)
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 italic py-6">No expenses logged for this trip.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB CONTENT: STATS & CONTRIBUTIONS ──────────────────── */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Member Wise Contributions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Member Contributions</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Summary of contributions and net outcomes</p>
            </div>

            <div className="space-y-6">
              {trip.members.map(m => {
                const spent = m.expenses.reduce((sum, e) => sum + e.amount, 0);
                const balance = balances[m.id];
                const isCreditor = balance >= 0;
                
                // Percent contribution relative to maximum spent by anyone
                const maxSpent = Math.max(...trip.members.map(memb => memb.expenses.reduce((s, ex) => s + ex.amount, 0)), 1);
                const percent = (spent / maxSpent) * 100;

                return (
                  <div key={m.id} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                          {m.name.charAt(0)}
                        </div>
                        <span className="font-extrabold text-slate-700">{m.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-800">{spent.toFixed(2)} {trip.currency}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {/* Net Balance Tag */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">
                        Share: {(spent - balance).toFixed(2)} {trip.currency}
                      </span>
                      <span className={`font-bold px-2 py-0.5 rounded-md ${
                        isCreditor
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                          : 'bg-red-50 text-red-600 border border-red-100/50'
                      }`}>
                        {isCreditor ? '+' : ''}{balance.toFixed(2)} {trip.currency}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>


          </div>
        </div>
      )}

      {/* ── ACTION BUTTONS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
        <button
          onClick={handleCopySummary}
          className={`py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
            copied
              ? 'bg-emerald-600 text-white shadow-emerald-100'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 hover:-translate-y-0.5'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              Summary Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy Summary (WhatsApp)
            </>
          )}
        </button>

        {trip.status !== 'completed' && (
          <button
            onClick={() => router.push(`/wizard/${trip.id}/sharing`)}
            className="bg-white border border-slate-200/80 hover:border-slate-300 text-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Expenses / Add New
          </button>
        )}
      </div>

      <div className="text-center print:hidden flex flex-col items-center gap-4 mt-8">
        <button
          onClick={() => window.print()}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
        >
          🖨️ Print Report / Save PDF
        </button>
        <button
          onClick={handleDeleteTrip}
          disabled={isDeleting}
          className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-wider"
        >
          🗑️ {isDeleting ? 'Deleting...' : 'Delete Trip'}
        </button>
      </div>
    </div>
  );
}
