'use server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function saveMembers(tripId: string, names: string[]) {
  await db.member.createMany({
    data: names.map(name => ({
      name,
      tripId
    }))
  })
  redirect(`/wizard/${tripId}/sharing`)
}