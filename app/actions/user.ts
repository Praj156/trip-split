// app/actions/user.ts
'use server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function checkUser() {
  const user = await currentUser()

  // 1. Check if user is logged in via Clerk
  if (!user) return null

  // 2. Check if user is already in our Prisma database
  const loggedInUser = await db.user.findUnique({
    where: { id: user.id }
  })

  if (loggedInUser) return loggedInUser

  // 3. If not in DB, create them!
  const newUser = await db.user.create({
    data: {
      id: user.id, // We use the Clerk ID as our Primary Key
      email: user.emailAddresses[0].emailAddress,
      
    }
  })

  return newUser
}