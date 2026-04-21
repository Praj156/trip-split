import { db } from '@/lib/db'
import SharingForm from './SharingForm'
import { redirect } from 'next/navigation'

export default async function SharingPage({ params }: { params: Promise<{ tripId: string }> }) {
    // 1. Await the params promise to get the tripId
  const { tripId } = await params;
   
  
  // Fetch members to populate the 'Shared With' buttons
  const members = await db.member.findMany({
    where: { tripId }
  });

  if (members.length === 0) redirect(`/wizard/${tripId}/members`);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Step 3: Spending & Sharing</h1>
      <p className="text-gray-500 mb-10">
        Break down the expenses for each member and choose who shares the cost.
      </p>
      
      {/* Passing members to the Client Form */}
      <SharingForm tripId={tripId} members={members} />
    </div>
  )
}