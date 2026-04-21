'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { saveMembers } from '@/app/actions/member'

export default function MembersPage() {
  const { tripId } = useParams()
  const [names, setNames] = useState<string[]>([])
  const [newName, setNewName] = useState('')

  const addName = () => {
    if (newName.trim()) {
      setNames([...names, newName.trim()])
      setNewName('')
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Step 2: Who is on this trip?</h1>
      <p className="text-gray-500 mb-8">Add the names of each person or family group.</p>

      <div className="flex gap-2 mb-8">
        <input 
          placeholder="e.g. The Nargunds"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 border p-3 rounded-lg shadow-sm"
        />
        <button onClick={addName} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">
          Add
        </button>
      </div>

      <div className="space-y-3 mb-8">
        {names.map((name, i) => (
          <div key={i} className="p-4 bg-white border rounded-lg shadow-sm flex justify-between">
            <span className="font-medium text-lg">{name}</span>
          </div>
        ))}
      </div>

      {names.length > 0 && (
        <button 
          onClick={() => saveMembers(tripId as string, names)}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg"
        >
          Next: Add Spending & Sharing →
        </button>
      )}
    </div>
  )
}