import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase email links (sign-up confirmation) land here with a one-time
 * ?code=. Exchange it for a session cookie, then continue into the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL('/sign-in?error=link', origin));
}

function safeNext(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}
