import type { FormEvent } from 'react'

interface AuthPanelProps {
  email: string
  password: string
  error: string | null
  message: string | null
  isSubmitting: boolean
  mode: 'sign-in' | 'sign-up'
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  onModeChange: (mode: 'sign-in' | 'sign-up') => void
}

export function AuthPanel({
  email,
  password,
  error,
  message,
  isSubmitting,
  mode,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onModeChange,
}: AuthPanelProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-8 text-slate-100">
      <div className="w-full max-w-md rounded-[32px] border border-white/8 bg-slate-950/85 p-6 shadow-[0_32px_100px_rgba(2,8,23,0.65)] backdrop-blur sm:p-8">
        <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
          Supabase Auth
        </span>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-white">
          {mode === 'sign-in' ? 'Sign in to the meeting dashboard' : 'Create your account'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Authentication is handled by Supabase, while the backend accepts only
          valid Supabase access tokens for transcript analysis and saved history.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Email</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Password</span>
            <input
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/20"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Enter a strong password"
              autoComplete="current-password"
            />
          </label>

          {message ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !email.trim() || !password.trim()}
            className="w-full rounded-2xl bg-cyan-300 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {isSubmitting
              ? mode === 'sign-in'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'sign-in'
                ? 'Sign In'
                : 'Sign Up'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => onModeChange(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="mt-4 text-sm text-cyan-200 transition hover:text-cyan-100"
        >
          {mode === 'sign-in'
            ? "Need an account? Sign up with Supabase"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
