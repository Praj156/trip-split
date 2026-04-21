'use server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function createTrip(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get('name') as string;
  const startDate = new Date(formData.get('startDate') as string);
  const endDate = new Date(formData.get('endDate') as string);

  const trip = await db.trip.create({
    data: {
      name,
      startDate,
      endDate,
      userId, // Linking to the User who is logged in
    }
  });

  // Once created, move to Step 2: Add Members
  redirect(`/wizard/${trip.id}/members`);
}