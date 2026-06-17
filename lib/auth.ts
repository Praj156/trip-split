import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function getSession() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session ?? null;
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session || !session.user) {
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