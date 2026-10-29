import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { IconEye, IconEyeOff, IconLoader2 } from "@tabler/icons-react";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type Mode = "login" | "signup" | "forgot";

function FieldInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#d7b879]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-[#d7b879]/25 bg-[#211e19] px-4 py-3 text-sm text-[#f6f0e4] placeholder:text-[#eee6d7]/35 focus:border-[#d7b879]/60 focus:outline-none focus:ring-1 focus:ring-[#d7b879]/40 transition-colors"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#eee6d7]/50 hover:text-[#d7b879] transition-colors"
          >
            {show ? <IconEyeOff className="h-4 w-4" /> : <IconEye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function LoginSection() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    clearMessages();
    setEmail("");
    setPassword("");
    setDisplayName("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    clearMessages();

    try {
      if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (authError) throw authError;
        setSuccessMsg("Check your email for a password reset link.");
        return;
      }

      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        });
        if (authError) throw authError;

        // Create profile row
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: data.user.email ?? null,
            display_name: displayName || null,
          });
        }

        setSuccessMsg(
          data.session
            ? "Account created! Redirecting…"
            : "Account created! Check your email to confirm, then log in."
        );
        if (data.session) {
          setTimeout(() => navigate("/profile"), 800);
        }
        return;
      }

      // Login
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      navigate("/profile");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const titles: Record<Mode, string> = {
    login: "Welcome back",
    signup: "Create account",
    forgot: "Reset password",
  };

  const subtitles: Record<Mode, string> = {
    login: "Sign in to sync your heritage journey across devices.",
    signup: "Join to save favourites, quiz scores & timeline explorations.",
    forgot: "Enter your email and we'll send you a reset link.",
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-md flex-col justify-center px-5 py-16">
      {/* Header */}
      <div className="mb-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-[#d7b879]/75 hover:text-[#d7b879] transition-colors text-xs uppercase tracking-[.2em]">
          ← Home
        </Link>
        <h1 className="mt-6 font-serif text-4xl text-[#f4ecdd]">{titles[mode]}</h1>
        <p className="mt-3 text-sm leading-6 text-[#eee6d7]/65">{subtitles[mode]}</p>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[#d7b879]/20 bg-[radial-gradient(ellipse_at_top_left,rgba(142,103,46,.12),transparent_50%),linear-gradient(145deg,#211e19,#191714)] p-6 md:p-8 shadow-xl shadow-black/30">
        {!isSupabaseConfigured && (
          <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-900/15 px-4 py-3 text-xs leading-5 text-amber-300">
            <strong>⚠ Supabase not configured.</strong> Add{" "}
            <code className="font-mono">VITE_SUPABASE_URL</code> and{" "}
            <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> in your Vercel environment variables to enable auth.
          </div>
        )}

        {error && (
          <div role="alert" className="mb-5 rounded-lg border border-red-500/30 bg-red-900/15 px-4 py-3 text-xs leading-5 text-red-300">
            {error}
          </div>
        )}
        {successMsg && (
          <div role="status" className="mb-5 rounded-lg border border-green-500/30 bg-green-900/15 px-4 py-3 text-xs leading-5 text-green-300">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {mode === "signup" && (
            <FieldInput
              id="display-name"
              label="Display name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Your name (optional)"
              autoComplete="name"
            />
          )}

          <FieldInput
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />

          {mode !== "forgot" && (
            <FieldInput
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={mode === "signup" ? "Minimum 6 characters" : "Your password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-[11px] text-[#d7b879]/70 hover:text-[#d7b879] underline underline-offset-2 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-[#d7b879] px-6 py-3 text-[11px] font-semibold uppercase tracking-[.16em] text-[#211b12] transition-colors hover:bg-[#eed69f] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"
          >
            {loading && <IconLoader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        {/* Divider + OAuth */}
        {mode !== "forgot" && isSupabaseConfigured && (
          <>
            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-[#d7b879]/15" />
              <span className="text-[10px] uppercase tracking-[.18em] text-[#eee6d7]/40">or</span>
              <span className="h-px flex-1 bg-[#d7b879]/15" />
            </div>
            <GoogleOAuthButton />
          </>
        )}
      </div>

      {/* Mode switch */}
      <p className="mt-6 text-center text-xs text-[#eee6d7]/60">
        {mode === "login" ? (
          <>
            No account?{" "}
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className="text-[#d7b879] underline underline-offset-2 hover:text-[#eed69f] transition-colors"
            >
              Create one free
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-[#d7b879] underline underline-offset-2 hover:text-[#eed69f] transition-colors"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </section>
  );
}

function GoogleOAuthButton() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#d7b879]/20 bg-[#211e19] px-4 py-3 text-sm text-[#f6f0e4] transition-colors hover:border-[#d7b879]/40 hover:bg-[#2a261f] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b879]"
    >
      {loading ? (
        <IconLoader2 className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      Continue with Google
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
