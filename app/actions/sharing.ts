'use server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function saveExpenses(tripId: string, memberData: any[]) {
  const expenseRecords = memberData.flatMap(m => 
    m.expenses
      .filter((e: any) => e.amount > 0)
      .map((e: any) => ({
        amount: e.amount,
        description: e.description, // Correctly using description
        sharedWithIds: e.sharedWithIds,
        memberId: m.memberId
      }))
  )

  if (expenseRecords.length > 0) {
    await db.expense.createMany({ data: expenseRecords })
  }

  redirect(`/wizard/${tripId}/summary`)
}