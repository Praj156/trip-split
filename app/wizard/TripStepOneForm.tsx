// --- CLIENT COMPONENT FOR VALIDATION ---
// In Next.js, you can define a client component in the same file 
// if you use 'use client' at the top of the component definition 
// or move it to a separate file. For a "single file" request, 
// it's best to keep the form as a client-side part.

'use client'; 
// Note: In a real project, it is cleaner to put the following 
// in a file called TripStepOneForm.tsx

import { useState, useEffect } from 'react';
import { createTrip } from '../actions/trip';
import { useRouter } from 'next/navigation';

export default function TripStepOneForm() {
  const router = useRouter();
  const [dateError, setDateError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });

  // Real-time validation logic
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (start > end) {
        setDateError('To Date cannot be earlier than From Date.');
      } else {
        setDateError('');
      }
    }
  }, [formData.startDate, formData.endDate]);

  const handleFormAction = async (data: FormData) => {
    const start = new Date(data.get('startDate') as string);
    const end = new Date(data.get('endDate') as string);

    if (start > end) {
      setDateError('Please fix the dates before continuing.');
      return;
    }

    // Call the Server Action to save to DB
    await createTrip(data);
  };

  return (
    <form 
      action={handleFormAction} 
      className="space-y-6 bg-white p-8 rounded-2xl shadow-xl shadow-slate-100 border border-slate-100"
    >
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Trip Name</label>
        <input 
          name="name"
          type="text" 
          required
          placeholder="e.g. Dubai Summer Break"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">From Date</label>
          <input 
            name="startDate" 
            type="date" 
            required 
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className={`w-full border rounded-xl p-3 outline-none transition-all ${
              dateError ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-200 focus:border-blue-500'
            }`} 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">To Date</label>
          <input 
            name="endDate" 
            type="date" 
            required 
            min={formData.startDate} 
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className={`w-full border rounded-xl p-3 outline-none transition-all ${
              dateError ? 'border-red-500 ring-2 ring-red-50' : 'border-slate-200 focus:border-blue-500'
            }`} 
          />
        </div>
      </div>

      {dateError && (
        <p className="text-red-600 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
          ⚠️ {dateError}
        </p>
      )}

      <button 
        type="submit" 
        disabled={!!dateError}
        className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
          dateError 
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 hover:-translate-y-0.5'
        }`}
      >
        Next: Add Members & Spending →
      </button>

      <button 
        type="button" 
        onClick={() => router.back()}
        className="w-full text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}