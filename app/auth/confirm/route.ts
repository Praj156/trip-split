import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Email links (sign-up confirmation and password reset) land here with a
 * one-time ?token_hash=. Unlike the ?code= links handled by /auth/callback,
 * these work on any device or browser, so a reset requested on a laptop can be
 * finished from the email app on a phone.
 *
 * Email templates (Supabase → Authentication → Emails):
 *   Confirm signup:  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
 *   Reset password:  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 */
const TYPES: EmailOtpType[] = ['email', 'signup', 'recovery', 'invite', 'magiclink', 'email_change'];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const rawType = searchParams.get('type');
  const type = TYPES.includes(rawType as EmailOtpType) ? (rawType as EmailOtpType) : null;
  const next = safeNext(searchParams.get('next'), type === 'recovery' ? '/reset-password' : '/dashboard');

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  // Expired, already used, or malformed.
  if (type === 'recovery') return NextResponse.redirect(new URL('/reset-password?error=link', origin));
  return NextResponse.redirect(new URL('/sign-in?error=link', origin));
}

function safeNext(value: string | null, fallback: string) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
}
