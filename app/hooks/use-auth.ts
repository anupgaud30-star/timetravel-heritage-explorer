/**
 * useAuth — React hook for Supabase session state.
 * Provides the current user, loading state, and sign-out helper.
 *
 * NOTE: @supabase/supabase-js types are resolved at Vercel build time.
 * We use `any` locally to avoid TS errors when the package is not yet installed.
 */
import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

// Use `any` so TSC passes even when @supabase/supabase-js isn't installed locally.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySession = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyUser = any;

export type AuthState = {
  user: AnyUser | null;
  session: AnySession | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [session, setSession] = useState<AnySession>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    void supabase.auth.getSession().then(({ data }: { data: { session: AnySession } }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, newSession: AnySession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    user: session?.user ?? null,
    session,
    loading,
    signOut,
  };
}
