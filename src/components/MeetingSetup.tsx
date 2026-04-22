import type { ChangeEvent } from 'react'
import { FREQUENCY_OPTIONS, SENIORITY_OPTIONS } from '../constants'
import type { MeetingFormState, MeetingFrequency, Seniority } from '../types'
import { formatCompactCurrency, formatCurrency, getMonthlyProjection } from '../utils/format'
import { SectionCard } from './SectionCard'
import { StatTile } from './StatTile'

interface MeetingSetupProps {
  value: MeetingFormState
  isMeetingActive: boolean
  onChange: (nextValue: Partial<MeetingFormState>) => void
  onStart: () => void
}

const inputClassName =
  'mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20'

export function MeetingSetup({
  value,
  isMeetingActive,
  onChange,
  onStart,
}: MeetingSetupProps) {
  const burnRate = value.attendees * value.hourlyRate
  const projectedMeetingCost = (burnRate / 60) * value.durationMinutes
  const monthlyProjection = getMonthlyProjection(projectedMeetingCost, value.frequency)

  const handleNumberChange =
    (field: 'attendees' | 'hourlyRate' | 'durationMinutes') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value)
      onChange({ [field]: Number.isFinite(nextValue) ? nextValue : 0 })
    }

  const handleSeniorityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const seniority = event.target.value as Seniority
    const option = SENIORITY_OPTIONS.find((item) => item.value === seniority)

    onChange({
      seniority,
      hourlyRate: option?.rate ?? value.hourlyRate,
    })
  }

  return (
    <SectionCard
      eyebrow="Section 1"
      title="Meeting Setup"
      description="Choose the audience, pricing band, duration, and recurrence. The rate starts with a role-based estimate but stays editable so you can match your own org."
    >
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-medium text-slate-200">Meeting title</span>
            <input
              className={inputClassName}
              type="text"
              value={value.title}
              onChange={(event) => onChange({ title: event.target.value })}
              placeholder="Quarterly roadmap check-in"
            />
          </label>

          <label>
            <span className="text-sm font-medium text-slate-200">Number of attendees</span>
            <input
              className={inputClassName}
              type="number"
              min={1}
              step={1}
              value={value.attendees}
              onChange={handleNumberChange('attendees')}
            />
          </label>

          <label>
            <span className="text-sm font-medium text-slate-200">
              Average attendee seniority
            </span>
            <select
              className={inputClassName}
              value={value.seniority}
              onChange={handleSeniorityChange}
            >
              {SENIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({formatCurrency(option.rate)}/hr)
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="text-sm font-medium text-slate-200">
              Estimated hourly rate (USD)
            </span>
            <input
              className={inputClassName}
              type="number"
              min={1}
              step={1}
              value={value.hourlyRate}
              onChange={handleNumberChange('hourlyRate')}
            />
          </label>

          <label>
            <span className="text-sm font-medium text-slate-200">
              Meeting duration (minutes)
            </span>
            <input
              className={inputClassName}
              type="number"
              min={1}
              step={5}
              value={value.durationMinutes}
              onChange={handleNumberChange('durationMinutes')}
            />
          </label>

          <label className="sm:col-span-2">
            <span className="text-sm font-medium text-slate-200">Meeting frequency</span>
            <select
              className={inputClassName}
              value={value.frequency}
              onChange={(event) =>
                onChange({ frequency: event.target.value as MeetingFrequency })
              }
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-[26px] border border-emerald-300/15 bg-gradient-to-br from-emerald-400/10 via-slate-900/80 to-cyan-400/10 p-5">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatTile
              label="Hourly burn"
              value={formatCompactCurrency(burnRate)}
              helper={`${value.attendees} people x ${formatCurrency(value.hourlyRate)}/hr`}
              accent="emerald"
            />
            <StatTile
              label="Scheduled cost"
              value={formatCurrency(projectedMeetingCost)}
              helper={`For ${value.durationMinutes} minutes`}
              accent="cyan"
            />
            <StatTile
              label="Monthly projection"
              value={
                value.frequency === 'one-time'
                  ? 'One-time only'
                  : formatCurrency(monthlyProjection)
              }
              helper="Based on the selected recurrence"
              accent="amber"
            />
          </div>

          <button
            type="button"
            onClick={onStart}
            disabled={isMeetingActive}
            className="mt-5 w-full rounded-2xl bg-emerald-300 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
          >
            {isMeetingActive ? 'Meeting Meter Running' : 'Start Meter'}
          </button>
        </div>
      </div>
    </SectionCard>
  )
}
