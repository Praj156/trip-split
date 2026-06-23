import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Auth pages are statically prerendered during build. Supabase is only
    // used in event handlers and effects, so skip client creation on the server.
    return null as unknown as SupabaseClient;
  }

  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        '@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!\n\n' +
          'Check your Supabase project\'s API settings to find these values\n\n' +
          'https://supabase.com/dashboard/project/_/settings/api'
      );
    }

    client = createBrowserClient(url, key);
  }

  return client;
}
