import type { MeetingFormState, MeetingFrequency, Seniority } from './types'

export const STORAGE_KEY = 'meeting-productivity-analyzer-history'

export const SENIORITY_OPTIONS: Array<{
  value: Seniority
  label: string
  rate: number
}> = [
  { value: 'junior-dev', label: 'Junior Dev', rate: 35 },
  { value: 'mid-dev', label: 'Mid Dev', rate: 55 },
  { value: 'senior-dev', label: 'Senior Dev', rate: 85 },
  { value: 'engineering-manager', label: 'Engineering Manager', rate: 120 },
  { value: 'director', label: 'Director', rate: 165 },
  { value: 'cto', label: 'CTO', rate: 240 },
]

export const FREQUENCY_OPTIONS: Array<{
  value: MeetingFrequency
  label: string
}> = [
  { value: 'one-time', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export const MONTHLY_OCCURRENCES: Record<MeetingFrequency, number> = {
  'one-time': 0,
  daily: 20,
  weekly: 4.33,
  monthly: 1,
}

export const DEFAULT_FORM: MeetingFormState = {
  title: '',
  attendees: 6,
  seniority: 'senior-dev',
  hourlyRate: 85,
  durationMinutes: 45,
  frequency: 'weekly',
}
