'use client'
import { useState } from 'react'
import { saveExpenses } from '@/app/actions/sharing'

export default function SharingForm({ tripId, members }: any) {
  const [data, setData] = useState(
    members.map((m: any) => ({
      memberId: m.id,
      name: m.name,
      expenses: [{ 
        amount: 0, 
        description: '', 
        sharedWithIds: members.map((all: any) => all.id) 
      }]
    }))
  )

  const addRow = (mIdx: number) => {
    const newData = [...data]
    newData[mIdx].expenses.push({ 
      amount: 0, 
      description: '', 
      sharedWithIds: members.map((all: any) => all.id) 
    })
    setData(newData)
  }

  const updateField = (mIdx: number, eIdx: number, field: string, val: any) => {
    const newData = [...data]
    newData[mIdx].expenses[eIdx][field] = val
    setData(newData)
  }

  const toggleMember = (mIdx: number, eIdx: number, memberId: string) => {
    const current = data[mIdx].expenses[eIdx].sharedWithIds
    const next = current.includes(memberId)
      ? current.filter((id: string) => id !== memberId)
      : [...current, memberId]
    updateField(mIdx, eIdx, 'sharedWithIds', next)
  }

  return (
    <div className="space-y-12">
      {data.map((m: any, mIdx: number) => (
        <div key={m.memberId} className="bg-white p-6 rounded-2xl border-2 border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-blue-900 mb-6 uppercase tracking-wide">{m.name}</h2>
          
          {m.expenses.map((exp: any, eIdx: number) => (
            <div key={eIdx} className="mb-8 p-5 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-blue-400 uppercase">Amount</label>
                  <input 
                    type="number"
                    className="w-full p-2 border rounded bg-white font-bold"
                    value={exp.amount || ''}
                    onChange={(e) => updateField(mIdx, eIdx, 'amount', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-blue-400 uppercase">Description</label>
                  <input 
                    type="text"
                    placeholder="e.g. Dinner, Fuel, Tickets"
                    className="w-full p-2 border rounded bg-white"
                    value={exp.description}
                    onChange={(e) => updateField(mIdx, eIdx, 'description', e.target.value)}
                  />
                </div>
              </div>

              <label className="text-[10px] font-bold text-blue-400 uppercase">Shared With:</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {members.map((beneficiary: any) => (
                  <button
                    key={beneficiary.id}
                    onClick={() => toggleMember(mIdx, eIdx, beneficiary.id)}
                    className={`px-3 py-1 rounded-md text-xs font-bold border transition ${
                      exp.sharedWithIds.includes(beneficiary.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}
                  >
                    {beneficiary.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button onClick={() => addRow(mIdx)} className="text-blue-600 font-bold text-sm">+ Add Expense Row</button>
        </div>
      ))}

      <button onClick={() => saveExpenses(tripId, data)} className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl">
        FINALIZE TRIP →
      </button>
    </div>
  )
}