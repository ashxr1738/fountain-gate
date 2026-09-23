import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { CheckCircle2, Eye, EyeOff, LayoutDashboard } from "lucide-react";
import { useState, type FormEvent } from "react";

type LoginPageProps = {
  db: SupabaseClient | null;
  onSignedIn: (session: Session) => void;
};

export function LoginPage({ db, onSignedIn }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!db) {
      setError("Supabase is not configured. Contact IT support.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    const { data, error: signInError } = await db.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    if (data.session) onSignedIn(data.session);
  }

  async function resetPassword() {
    if (!db) {
      setError("Supabase is not configured. Contact IT support.");
      return;
    }
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    const { error: resetError } = await db.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setBusy(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("If an account exists for that email, we sent a password reset link.");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="hidden min-h-screen flex-col justify-between bg-[#1e293b] p-10 text-white lg:flex xl:p-16" aria-labelledby="brand-title">
        <div>
          <div className="mb-16 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-indigo-400 text-slate-950" aria-hidden="true">
              <LayoutDashboard size={23} strokeWidth={2.25} />
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Asset Portal</span>
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">EquipTrack</p>
          <h1 id="brand-title" className="max-w-lg text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
            Equipment borrowing without the guesswork.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            One place to find available gear, request checkouts, and keep every return accounted for.
          </p>
          <ul className="mt-12 max-w-md space-y-6" aria-label="Portal capabilities">
            <li className="flex gap-3 text-sm leading-6 text-slate-200">
              <CheckCircle2 className="mt-0.5 shrink-0 text-indigo-300" size={19} aria-hidden="true" />
              <span><strong className="font-semibold text-white">Users:</strong> Browse catalog and request gear checkouts.</span>
            </li>
            <li className="flex gap-3 text-sm leading-6 text-slate-200">
              <CheckCircle2 className="mt-0.5 shrink-0 text-indigo-300" size={19} aria-hidden="true" />
              <span><strong className="font-semibold text-white">Admins:</strong> Add new equipment and track returns.</span>
            </li>
          </ul>
        </div>
        <p className="text-xs text-slate-400">Internal equipment operations</p>
      </aside>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20" aria-labelledby="login-title">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700 lg:hidden">EquipTrack / Asset Portal</p>
            <h2 id="login-title" className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Welcome Back</h2>
            <p className="mt-3 text-base leading-6 text-slate-600">Sign in to manage inventory.</p>
          </div>

          {error && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800" role="alert" aria-live="assertive">{error}</p>}
          {message && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-5 text-emerald-800" role="status" aria-live="polite">{message}</p>}

          <form className="space-y-6" onSubmit={submit}>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label className="block text-sm font-semibold text-slate-800" htmlFor="login-password">Password</label>
                <button type="button" className="rounded text-sm font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-4 transition hover:text-indigo-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60" onClick={() => void resetPassword()} disabled={busy}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 pr-12 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(value => !value)}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={busy} className="min-h-12 w-full rounded-lg bg-indigo-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800 active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-wait disabled:opacity-60">
              {busy ? "Signing in..." : "Sign In to Portal"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">Need admin access? Contact IT support.</p>
        </div>
      </section>
    </main>
  );
}
