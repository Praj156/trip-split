require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
 
console.log('=== Environment Variables Check ===\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✓ Found' : '✗ Missing');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? '✓ Found' : '✗ Missing');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Found' : '✗ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Found' : '✗ Missing');
 
console.log('\n=== Full Values ===\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET');
console.log('DIRECT_URL:', process.env.DIRECT_URL || 'NOT SET');