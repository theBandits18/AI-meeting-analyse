import type { LiveMeeting } from '../types'
import {
  formatCurrency,
  formatTimer,
  getFrequencyLabel,
  getMonthlyProjection,
} from '../utils/format'
import { SectionCard } from './SectionCard'
import { StatTile } from './StatTile'

interface LiveCostMeterProps {
  meeting: LiveMeeting | null
  onEnd: () => void
}

export function LiveCostMeter({ meeting, onEnd }: LiveCostMeterProps) {
  if (!meeting) {
    return (
      <SectionCard
        eyebrow="Section 2"
        title="Live Cost Meter"
        description="Start the meeting meter to watch your live spend climb in real time."
      >
        <div className="rounded-3xl border border-dashed border-white/12 bg-slate-900/40 p-8 text-center text-slate-400">
          Configure the meeting above, then start the meter to begin tracking cost.
        </div>
      </SectionCard>
    )
  }

  const burnRate = meeting.config.attendees * meeting.config.hourlyRate
  const costPerMinute = burnRate / 60
  const totalCost = burnRate * (meeting.elapsedMs / 3_600_000)
  const projectedMeetingCost = costPerMinute * meeting.config.durationMinutes
  const monthlyProjection = getMonthlyProjection(
    projectedMeetingCost,
    meeting.config.frequency,
  )
  const progress = Math.min(
    (meeting.elapsedMs / (meeting.config.durationMinutes * 60_000)) * 100,
    100,
  )
  const isMeetingActive = meeting.endedAt === null

  return (
    <SectionCard
      eyebrow="Section 2"
      title="Live Cost Meter"
      description="The live meter uses attendee count and hourly burn rate to simulate how quickly the room is consuming engineering budget."
    >
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.24),_transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/70">
                {meeting.config.title.trim() || 'Untitled meeting'}
              </p>
              <h3 className="mt-2 font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
                {formatCurrency(totalCost)}
              </h3>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              {isMeetingActive ? 'Meter is live' : 'Meeting ended'}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Elapsed"
              value={formatTimer(meeting.elapsedMs)}
              helper={`${meeting.config.durationMinutes}-minute plan`}
              accent="emerald"
            />
            <StatTile
              label="Cost per minute"
              value={formatCurrency(costPerMinute)}
              helper={`${meeting.config.attendees} attendees at ${formatCurrency(
                meeting.config.hourlyRate,
              )}/hr`}
              accent="cyan"
            />
            <StatTile
              label="Monthly cost"
              value={
                meeting.config.frequency === 'one-time'
                  ? 'One-time only'
                  : formatCurrency(monthlyProjection)
              }
              helper={getFrequencyLabel(meeting.config.frequency)}
              accent="amber"
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>Planned duration progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-[28px] border border-white/8 bg-slate-900/80 p-5">
          <div className="space-y-3 text-sm leading-6 text-slate-300">
            <p>
              Burn rate:{' '}
              <span className="font-semibold text-white">{formatCurrency(burnRate)}/hr</span>
            </p>
            <p>
              Scheduled meeting cost:{' '}
              <span className="font-semibold text-white">
                {formatCurrency(projectedMeetingCost)}
              </span>
            </p>
            <p>
              Recurrence:{' '}
              <span className="font-semibold text-white">
                {getFrequencyLabel(meeting.config.frequency)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onEnd}
            disabled={!isMeetingActive}
            className="mt-6 rounded-2xl bg-rose-300 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {isMeetingActive ? 'End Meeting' : 'Meeting Closed'}
          </button>
        </div>
      </div>
    </SectionCard>
  )
}
