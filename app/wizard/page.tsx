// app/wizard/page.tsx
import { checkUser } from '../actions/user'
import { redirect } from 'next/navigation'
import { createTrip } from '../actions/trip'

export default async function WizardPage() {
  const user = await checkUser()
  
  if (!user) redirect('/') // Kick them back home if not logged in

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Plan a New Trip</h1>
        <p className="text-gray-500">Step 1: The Basics</p>
      </div>

      <form action={createTrip} className="space-y-6 bg-white p-8 rounded-xl shadow-sm border">
        <div>
          <label className="block text-sm font-medium text-gray-700">Trip Name</label>
          <input 
            name="name"
            type="text" 
            required
            placeholder="e.g. Dubai Summer Break"
            className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">From Date</label>
            <input name="startDate" type="date" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">To Date</label>
            <input name="endDate" type="date" required className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm" />
          </div>
        </div>

        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition">
          Next: Add Members & Spending →
        </button>
      </form>
    </div>
  )
}