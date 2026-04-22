import { FREQUENCY_OPTIONS, MONTHLY_OCCURRENCES, SENIORITY_OPTIONS } from '../constants'
import type { MeetingFrequency, Seniority } from '../types'

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)

export const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

export const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

export const formatTimer = (elapsedMs: number) => {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
        seconds,
      ).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const formatDateTime = (value: string | number) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export const getFrequencyLabel = (frequency: MeetingFrequency) =>
  FREQUENCY_OPTIONS.find((option) => option.value === frequency)?.label ?? frequency

export const getMonthlyProjection = (
  costPerMeeting: number,
  frequency: MeetingFrequency,
) => costPerMeeting * MONTHLY_OCCURRENCES[frequency]

export const getSeniorityLabel = (seniority: Seniority) =>
  SENIORITY_OPTIONS.find((option) => option.value === seniority)?.label ?? seniority
