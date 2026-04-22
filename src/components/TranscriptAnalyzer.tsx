import type { LiveMeeting, TranscriptAnalysis } from '../types'
import { formatCurrency, formatPercent } from '../utils/format'
import { SectionCard } from './SectionCard'
import { StatTile } from './StatTile'

interface TranscriptAnalyzerProps {
  meeting: LiveMeeting | null
  transcript: string
  analysis: TranscriptAnalysis | null
  isAnalyzing: boolean
  onTranscriptChange: (value: string) => void
  onAnalyze: () => void
}

const verdictClasses: Record<string, string> = {
  "Should've been an email": 'border-rose-300/30 bg-rose-400/10 text-rose-100',
  "Could've been shorter": 'border-amber-300/30 bg-amber-400/10 text-amber-100',
  'Good sync': 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100',
  'High value meeting': 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100',
}

export function TranscriptAnalyzer({
  meeting,
  transcript,
  analysis,
  isAnalyzing,
  onTranscriptChange,
  onAnalyze,
}: TranscriptAnalyzerProps) {
  const canAnalyze = Boolean(meeting && meeting.endedAt && transcript.trim())

  return (
    <SectionCard
      eyebrow="Section 3"
      title="Transcript Analyzer"
      description="Paste notes or a transcript after the meeting ends. The app scores decision density, question coverage, and filler content locally in your browser."
    >
      {!meeting ? (
        <div className="rounded-3xl border border-dashed border-white/12 bg-slate-900/40 p-8 text-center text-slate-400">
          End a meeting to unlock the transcript analyzer.
        </div>
      ) : meeting.endedAt === null ? (
        <div className="rounded-3xl border border-dashed border-white/12 bg-slate-900/40 p-8 text-center text-slate-400">
          The analyzer becomes available after you stop the live meter.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[26px] border border-white/8 bg-slate-900/80 p-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">
                Meeting notes or transcript
              </span>
              <textarea
                className="mt-3 min-h-64 w-full rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                placeholder="Paste your transcript here. Example: We agreed Priya will own the release checklist and set a deadline for Friday..."
                value={transcript}
                onChange={(event) => onTranscriptChange(event.target.value)}
              />
            </label>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                Decision phrases tracked:{' '}
                <span className="text-slate-200">
                  we will, agreed, action item, owner, deadline
                </span>
              </p>
              <button
                type="button"
                onClick={onAnalyze}
                disabled={!canAnalyze || isAnalyzing}
                className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Meeting'}
              </button>
            </div>
          </div>

          {analysis ? (
            <div className="rounded-[26px] border border-white/8 bg-slate-900/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-slate-400">
                    Meeting ROI Score
                  </p>
                  <h3 className="mt-2 font-display text-5xl font-semibold tracking-tight text-white">
                    {analysis.roiScore}
                  </h3>
                </div>
                <span
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    verdictClasses[analysis.verdict]
                  }`}
                >
                  {analysis.verdict}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <StatTile
                  label="Decision phrases"
                  value={analysis.decisionPhraseCount}
                  helper="Signals concrete outcomes"
                  accent="emerald"
                />
                <StatTile
                  label="Question density"
                  value={formatPercent(analysis.questionDensity)}
                  helper={`${analysis.questionCount} question marks found`}
                  accent="cyan"
                />
                <StatTile
                  label="Filler ratio"
                  value={formatPercent(analysis.fillerRatio)}
                  helper={`${analysis.fillerCount} filler phrases`}
                  accent="amber"
                />
                <StatTile
                  label="Cost analyzed"
                  value={formatCurrency(
                    meeting.config.attendees *
                      meeting.config.hourlyRate *
                      (meeting.elapsedMs / 3_600_000),
                  )}
                  helper={`${analysis.wordCount} words across ${analysis.sentenceCount} sentences`}
                  accent="rose"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-[26px] border border-dashed border-white/12 bg-slate-900/50 p-8 text-center text-slate-400">
              Run the local analysis to generate an ROI score and verdict badge.
            </div>
          )}
        </div>
      )}
    </SectionCard>
  )
}
