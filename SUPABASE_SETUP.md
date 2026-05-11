# Supabase Auth Migration - Setup Guide

## ✅ Completed Migration Tasks
- Removed all Clerk dependencies and code
- Added Supabase packages (@supabase/supabase-js, @supabase/ssr)
- Updated middleware to use Supabase auth
- Created custom sign-in and sign-up forms
- Created custom user menu component
- Updated all protected layouts
- Updated server actions to use Supabase auth
- Updated home page with Supabase auth

## 📋 Next Steps: Setup Supabase

### 1. Create a Supabase Project
1. Go to https://supabase.com
2. Create a new project (or use existing)
3. From the project dashboard, go to **Settings > API**
4. Copy these values:
   - `NEXT_PUBLIC_SUPABASE_URL` - Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Service role key (keep secret)

### 2. Set Environment Variables
Create/update `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_postgresql_connection_string
```

For local development with `npm run dev`, also update `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
DATABASE_URL=your_postgresql_connection_string
```

### 3. Update Prisma Schema (Optional but Recommended)
Edit `/prisma/schema.prisma` - change user ID from `cuid()` to `uuid()`:

```prisma
model User {
  id    String @id @default(uuid()) @db.Uuid
  email String @unique
  trips Trip[]
}
```

### 4. Run Database Migrations

```bash
# Generate new Prisma client
npx prisma generate

# Create/update database migrations
npx prisma migrate dev --name initial

# Or if using Supabase Cloud, just push the schema:
npx prisma db push
```

### 5. Test the Application

Start your dev server:
```bash
npm run dev
```

Open http://localhost:3000 and test:
- ✅ Landing page loads
- ✅ Click "Start Your First Trip" → redirects to sign-up
- ✅ Sign up with an email and password
- ✅ Successfully redirects to dashboard
- ✅ User appears in Supabase Auth (check Auth > Users in dashboard)
- ✅ User appears in Prisma database
- ✅ Click user avatar → sign out works
- ✅ After sign out → redirects to home page

## 🔐 Key Changes from Clerk

| Feature | Clerk | Supabase |
|---------|-------|----------|
| **Session Storage** | Managed by ClerkProvider | Stored in cookies (SSR) |
| **Get Current User** | `auth()` and `currentUser()` | `getSession()` and `getCurrentUser()` |
| **UI Components** | Pre-built `<SignIn>`, `<SignUp>` | Custom forms (you built these) |
| **User Profile** | `<UserButton />` | Custom `<UserMenu />` |
| **Middleware** | `clerkMiddleware()` | Custom middleware with Supabase session check |
| **User ID Format** | String (Clerk ID) | UUID string (Supabase) |

## 📁 New Files Created
- `/lib/supabase/client.ts` - Browser client
- `/lib/supabase/server.ts` - Server/SSR client
- `/lib/auth.ts` - Auth helper functions
- `/app/components/UserMenu.tsx` - Custom user menu

## 🐛 Troubleshooting

### "getSession is returning null"
- Make sure Supabase credentials are in `.env.local`
- Verify cookies are being set (check browser DevTools > Application > Cookies)
- Ensure you're testing after signing up/in

### "User not found in database"
- The `checkUser()` action creates users automatically on sign-up
- If user exists in Supabase Auth but not Prisma, navigate to `/dashboard` to trigger sync

### "Cannot find module '@supabase/ssr'"
- Run `npm install` again
- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`

### Middleware not redirecting to sign-in
- Verify Supabase environment variables are set
- Check that session cookies are being created in browser
- Look at Network tab in DevTools to see auth API calls

## 💡 Next: Optional Enhancements
1. Add email verification for new sign-ups
2. Add password reset functionality
3. Add social authentication (Google, GitHub, etc)
4. Add TOTP MFA support
5. Add rate limiting on auth endpoints

Good luck! 🚀
