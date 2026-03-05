import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

// Browser client (for client components)
export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase env vars not configured');
  }
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}
