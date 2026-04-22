export type MeetingFrequency = 'one-time' | 'daily' | 'weekly' | 'monthly'

export type Seniority =
  | 'junior-dev'
  | 'mid-dev'
  | 'senior-dev'
  | 'engineering-manager'
  | 'director'
  | 'cto'

export interface MeetingFormState {
  title: string
  attendees: number
  seniority: Seniority
  hourlyRate: number
  durationMinutes: number
  frequency: MeetingFrequency
}

export interface LiveMeeting {
  id: string
  config: MeetingFormState
  startedAt: number
  endedAt: number | null
  elapsedMs: number
}

export interface TranscriptAnalysis {
  wordCount: number
  sentenceCount: number
  decisionPhraseCount: number
  questionCount: number
  questionDensity: number
  fillerCount: number
  fillerRatio: number
  roiScore: number
  verdict: string
}

export interface MeetingRecord extends MeetingFormState {
  id: string
  startedAt: string
  endedAt: string
  actualDurationMinutes: number
  totalCost: number
  costPerMinute: number
  monthlyProjection: number
  transcript: string
  analysis: TranscriptAnalysis
}
