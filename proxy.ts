import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Pages anyone can open without signing in.
const PUBLIC_PATHS = ['/', '/sign-in', '/sign-up', '/forgot-password', '/reset-password'];
const PUBLIC_PREFIXES = ['/m/', '/auth/'];
// Signed-in users are sent to their dashboard from these.
const AUTH_PAGES = ['/sign-in', '/sign-up'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    AUTH_PAGES.some((page) => pathname.startsWith(`${page}/`));

  // Member share links never need a Supabase round-trip.
  if (pathname.startsWith('/m/')) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser() validates the token with Supabase and refreshes it if needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    const url = new URL('/sign-in', request.url);
    if (pathname !== '/') url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|txt|xml|webmanifest)$).*)',
  ],
};
