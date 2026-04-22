import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { DEFAULT_FORM } from './constants'
import { AuthPanel } from './components/AuthPanel'
import { HistoryDashboard } from './components/HistoryDashboard'
import { LiveCostMeter } from './components/LiveCostMeter'
import { MeetingSetup } from './components/MeetingSetup'
import { TranscriptAnalyzer } from './components/TranscriptAnalyzer'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import type { LiveMeeting, MeetingFormState, MeetingRecord, TranscriptAnalysis } from './types'
import {
  analyzeMeetingTranscript,
  fetchMeetingHistory,
  saveMeetingRecord,
  pingBackend,
} from './utils/api'
import {
  formatCompactCurrency,
  formatCurrency,
  getMonthlyProjection,
} from './utils/format'
import { loadMeetingHistory, replaceMeetingHistory } from './utils/storage'

const sanitizeForm = (form: MeetingFormState): MeetingFormState => ({
  title: form.title.trimStart(),
  attendees: Math.max(1, Math.round(form.attendees || 1)),
  seniority: form.seniority,
  hourlyRate: Math.max(1, Math.round(form.hourlyRate || 1)),
  durationMinutes: Math.max(1, Math.round(form.durationMinutes || 1)),
  frequency: form.frequency,
})

function App() {
  const [form, setForm] = useState<MeetingFormState>(DEFAULT_FORM)
  const [currentMeeting, setCurrentMeeting] = useState<LiveMeeting | null>(null)
  const [transcript, setTranscript] = useState('')
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null)
  const [history, setHistory] = useState<MeetingRecord[]>(() => loadMeetingHistory())
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>(
    'checking',
  )
  const [session, setSession] = useState<Session | null>(null)
  const [authStatus, setAuthStatus] = useState<
    'checking' | 'authenticated' | 'unauthenticated'
  >('checking')
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const isMeetingActive = Boolean(currentMeeting && currentMeeting.endedAt === null)
  const burnRate = form.attendees * form.hourlyRate
  const projectedMeetingCost = (burnRate / 60) * form.durationMinutes
  const monthlyProjection = getMonthlyProjection(projectedMeetingCost, form.frequency)

  useEffect(() => {
    let isMounted = true

    const checkBackend = async () => {
      try {
        const healthy = await pingBackend()

        if (isMounted) {
          setServerStatus(healthy ? 'online' : 'offline')
        }
      } catch {
        if (isMounted) {
          setServerStatus('offline')
        }
      }
    }

    void checkBackend()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthStatus('unauthenticated')
      setAuthError(
        'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a local .env file.',
      )
      return undefined
    }

    let isMounted = true

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) {
        return
      }

      if (error) {
        setAuthError(error.message)
        setAuthStatus('unauthenticated')
        return
      }

      setSession(data.session)
      setAuthStatus(data.session ? 'authenticated' : 'unauthenticated')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return
      }

      setSession(nextSession)
      setAuthStatus(nextSession ? 'authenticated' : 'unauthenticated')
      setAuthError(null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.access_token) {
      return
    }

    let isMounted = true

    const syncHistory = async () => {
      try {
        const meetings = await fetchMeetingHistory(session.access_token)

        if (!isMounted) {
          return
        }

        setHistory(meetings)
        replaceMeetingHistory(meetings)
        setRequestError(null)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setRequestError(
          error instanceof Error ? error.message : 'Unable to load meeting history.',
        )
      }
    }

    void syncHistory()

    return () => {
      isMounted = false
    }
  }, [session?.access_token])

  // Recalculate from the original start time so the live cost counter never drifts.
  useEffect(() => {
    if (!currentMeeting || currentMeeting.endedAt !== null) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setCurrentMeeting((activeMeeting) =>
        activeMeeting && activeMeeting.endedAt === null
          ? {
              ...activeMeeting,
              elapsedMs: Date.now() - activeMeeting.startedAt,
            }
          : activeMeeting,
      )
    }, 100)

    return () => window.clearInterval(interval)
  }, [currentMeeting?.id, currentMeeting?.endedAt])

  const handleStartMeeting = () => {
    const nextForm = sanitizeForm(form)
    const startTime = Date.now()

    setForm(nextForm)
    setTranscript('')
    setAnalysis(null)
    setRequestError(null)
    setCurrentMeeting({
      id: crypto.randomUUID(),
      config: nextForm,
      startedAt: startTime,
      endedAt: null,
      elapsedMs: 0,
    })
  }

  const handleEndMeeting = () => {
    setCurrentMeeting((activeMeeting) =>
      activeMeeting && activeMeeting.endedAt === null
        ? {
            ...activeMeeting,
            endedAt: Date.now(),
            elapsedMs: Date.now() - activeMeeting.startedAt,
          }
        : activeMeeting,
    )
  }

  const handleTranscriptChange = (value: string) => {
    setTranscript(value)
    setAnalysis(null)
    setRequestError(null)
  }

  const handleAuthSubmit = async () => {
    if (!supabase) {
      return
    }

    setIsSubmittingAuth(true)
    setAuthError(null)
    setAuthMessage(null)

    try {
      if (authMode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        })

        if (error) {
          throw error
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        })

        if (error) {
          throw error
        }

        if (!data.session) {
          setAuthMessage(
            'Account created. Check your email if your Supabase project requires confirmation before sign-in.',
          )
        } else {
          setAuthMessage('Account created and signed in successfully.')
        }
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  const handleLogout = async () => {
    if (!supabase) {
      return
    }

    await supabase.auth.signOut()
    setSession(null)
    setAuthStatus('unauthenticated')
    setCurrentMeeting(null)
    setAnalysis(null)
    setTranscript('')
  }

  const handleAnalyzeMeeting = async () => {
    if (
      !session?.access_token ||
      !currentMeeting ||
      currentMeeting.endedAt === null ||
      !transcript.trim()
    ) {
      return
    }

    setIsAnalyzing(true)
    setRequestError(null)

    const totalCost =
      currentMeeting.config.attendees *
      currentMeeting.config.hourlyRate *
      (currentMeeting.elapsedMs / 3_600_000)

    try {
      const result = await analyzeMeetingTranscript(
        transcript.trim(),
        totalCost,
        session.access_token,
      )
      const record: MeetingRecord = {
        ...currentMeeting.config,
        id: currentMeeting.id,
        startedAt: new Date(currentMeeting.startedAt).toISOString(),
        endedAt: new Date(currentMeeting.endedAt).toISOString(),
        actualDurationMinutes: currentMeeting.elapsedMs / 60_000,
        totalCost,
        costPerMinute:
          (currentMeeting.config.attendees * currentMeeting.config.hourlyRate) / 60,
        monthlyProjection:
          currentMeeting.config.frequency === 'one-time'
            ? 0
            : getMonthlyProjection(totalCost, currentMeeting.config.frequency),
        transcript: transcript.trim(),
        analysis: result,
      }

      const updatedHistory = await saveMeetingRecord(record, session.access_token)
      setAnalysis(result)
      setHistory(updatedHistory)
      replaceMeetingHistory(updatedHistory)
      setServerStatus('online')
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : 'Unable to analyze and save meeting.',
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  if (authStatus !== 'authenticated') {
    return (
      <AuthPanel
        email={authEmail}
        password={authPassword}
        error={authError}
        message={authMessage}
        isSubmitting={isSubmittingAuth || authStatus === 'checking'}
        mode={authMode}
        onEmailChange={setAuthEmail}
        onPasswordChange={setAuthPassword}
        onSubmit={handleAuthSubmit}
        onModeChange={(mode) => {
          setAuthMode(mode)
          setAuthError(null)
          setAuthMessage(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_32%),linear-gradient(140deg,rgba(2,6,23,0.98),rgba(15,23,42,0.94))] p-6 shadow-[0_30px_100px_rgba(2,8,23,0.6)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr]">
            <div>
              <span className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
                {session?.user.email ?? 'Supabase user'}
              </span>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Meeting Cost Calculator & Productivity Analyzer
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Track real-time meeting spend, score the value of the discussion,
                and build a lightweight history dashboard with Supabase-authenticated
                backend storage and analysis.
              </p>
              <p className="mt-3 text-sm text-slate-400">
                {serverStatus === 'online'
                  ? 'Your Supabase session is active and the backend is available.'
                  : serverStatus === 'offline'
                    ? 'The backend is offline right now, so protected actions will fail until it comes back.'
                    : 'Checking backend connectivity before syncing meeting history.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-medium text-slate-100 transition hover:bg-white/10"
              >
                Log out
              </button>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Current burn plan
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {formatCompactCurrency(burnRate)}
                </p>
                <p className="mt-2 text-sm text-slate-300">Per hour based on attendees and rate</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Scheduled cost
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {formatCurrency(projectedMeetingCost)}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Forecast for the configured meeting length
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Monthly exposure
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  {form.frequency === 'one-time'
                    ? 'One-time'
                    : formatCurrency(monthlyProjection)}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Based on the recurrence chosen below
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-6 grid gap-6">
          {requestError ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
              {requestError}
            </div>
          ) : null}

          {/* The single-page layout is split into four focused sections so it stays readable on desktop and mobile. */}
          <MeetingSetup
            value={form}
            isMeetingActive={isMeetingActive}
            onChange={(nextValue) =>
              setForm((currentValue) => ({
                ...currentValue,
                ...nextValue,
              }))
            }
            onStart={handleStartMeeting}
          />

          <LiveCostMeter meeting={currentMeeting} onEnd={handleEndMeeting} />

          <TranscriptAnalyzer
            meeting={currentMeeting}
            transcript={transcript}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            onTranscriptChange={handleTranscriptChange}
            onAnalyze={handleAnalyzeMeeting}
          />

          <HistoryDashboard history={history} />
        </main>
      </div>
    </div>
  )
}

export default App
