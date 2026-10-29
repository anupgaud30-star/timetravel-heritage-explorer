/**
 * Supabase client for TimeTravel Heritage Explorer.
 *
 * Required env vars (add in Vercel Dashboard → Settings → Environment Variables):
 *   VITE_SUPABASE_URL       — e.g. https://abcdef.supabase.co
 *   VITE_SUPABASE_ANON_KEY  — your project's anon/public key
 *
 * The `supabase` export is `null` when env vars are missing, so every caller
 * must guard:  if (!supabase) return;
 */

// @ts-ignore — resolved by Vercel at build time; absent in local sandbox
import { createClient } from "@supabase/supabase-js"; // eslint-disable-line

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: any =
  isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

if (!isSupabaseConfigured) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. " +
      "Auth features disabled. Add them in Vercel → Project → Settings → Environment Variables."
  );
}
