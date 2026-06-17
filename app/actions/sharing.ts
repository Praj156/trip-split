'use server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function saveExpenses(tripId: string, memberData: any[]) {
  const expenseRecords = memberData.flatMap(m => 
    m.expenses
      .filter((e: any) => e.amount > 0 && e.sharedWithIds.length > 0)
      .map((e: any) => ({
        amount: e.amount,
        description: e.description,
        sharedWithIds: e.sharedWithIds,
        paidById: m.memberId,
        tripId,
      }))
  )

  // Use a transaction to delete existing expenses and insert new ones
  await db.$transaction(async (tx: any) => {
    await tx.expense.deleteMany({
      where: { tripId },
    });

    if (expenseRecords.length > 0) {
      await tx.expense.createMany({ data: expenseRecords });
    }
  });

  redirect(`/wizard/${tripId}/summary`);
}