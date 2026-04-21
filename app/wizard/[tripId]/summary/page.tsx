import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

export default async function SummaryPage({ params }: { params: Promise<{ tripId: string }> }) {
  // 1. Await the params promise to get the tripId
  const { tripId } = await params;
  
  // 2. Now tripId is a string, so Prisma won't see 'undefined'  
  const trip = await db.trip.findUnique({
    where: { id: tripId },
    include: {
      members: {
        include: { expenses: true }
      }
    }
  });

  if (!trip) notFound();

  // 1. Calculate Total Trip Expense
  const totalTripExpense = trip.members.reduce((acc, m) => 
    acc + m.expenses.reduce((sum, e) => sum + e.amount, 0), 0
  );

  // 2. Calculate Net Balances
  const balances: { [memberId: string]: number } = {};
  trip.members.forEach(m => balances[m.id] = 0);

  trip.members.forEach(member => {
    member.expenses.forEach(expense => {
      // The person who paid gets a credit
      balances[member.id] += expense.amount;

      // The cost is split among everyone in sharedWithIds
      const splitAmount = expense.amount / expense.sharedWithIds.length;
      expense.sharedWithIds.forEach(id => {
        balances[id] -= splitAmount;
      });
    });
  });

  // 3. Settlement Algorithm (Who pays whom)
  const debtors: { id: string, name: string, amount: number }[] = [];
  const creditors: { id: string, name: string, amount: number }[] = [];

  Object.entries(balances).forEach(([id, balance]) => {
    const name = trip.members.find(m => m.id === id)?.name || "Unknown";
    if (balance < -0.01) debtors.push({ id, name, amount: Math.abs(balance) });
    else if (balance > 0.01) creditors.push({ id, name, amount: balance });
  });

  const settlements: { from: string, to: string, amount: number }[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const payment = Math.min(debtors[dIdx].amount, creditors[cIdx].amount);
    settlements.push({
      from: debtors[dIdx].name,
      to: creditors[cIdx].name,
      amount: payment
    });

    debtors[dIdx].amount -= payment;
    creditors[cIdx].amount -= payment;

    if (debtors[dIdx].amount < 0.01) dIdx++;
    if (creditors[cIdx].amount < 0.01) cIdx++;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
      {/* Header */}
      <div className="text-center bg-blue-600 text-white p-8 rounded-3xl shadow-lg">
        <h1 className="text-4xl font-black mb-2 uppercase">{trip.name}</h1>
        <p className="text-blue-100 font-medium italic">
          {new Date(trip.startDate).toLocaleDateString()} — {new Date(trip.endDate).toLocaleDateString()}
        </p>
        <div className="mt-6 pt-6 border-t border-blue-400">
          <p className="text-xs uppercase font-bold tracking-widest opacity-80">Total Trip Expense</p>
          <p className="text-5xl font-black">{totalTripExpense.toFixed(2)} AED</p>
        </div>
      </div>

      {/* Member Wise Spending */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          📊 Member Contributions
        </h2>
        <div className="space-y-3">
          {trip.members.map(m => {
            const spent = m.expenses.reduce((sum, e) => sum + e.amount, 0);
            return (
              <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{m.name}</span>
                <span className="font-bold">{spent.toFixed(2)} AED</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Final Settlements */}
      <div className="bg-green-50 p-6 rounded-2xl border-2 border-green-100 shadow-sm">
        <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
          💸 Who Pays Whom
        </h2>
        <div className="space-y-4">
          {settlements.length > 0 ? settlements.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-white p-4 rounded-xl border border-green-200 shadow-sm">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-red-500 uppercase">Debtor</span>
                <span className="font-bold text-lg">{s.from}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-green-600 font-black">➔</span>
                <span className="font-mono font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  {s.amount.toFixed(2)} AED
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-green-500 uppercase">Recipient</span>
                <span className="font-bold text-lg">{s.to}</span>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-500 py-4 italic">Everything is perfectly balanced!</p>
          )}
        </div>
      </div>

      <button className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition">
        Export as PDF / Share Summary
      </button>
    </div>
  );
}