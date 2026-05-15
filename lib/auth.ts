import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
  const supabase = await createClient();
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  return session.user;
}

export async function checkUser() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  // Check if user exists in database, create if not
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email!,
      },
    });
  }

  return dbUser;
}