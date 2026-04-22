import type { MeetingRecord, TranscriptAnalysis } from '../types'

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? 'Request failed.')
  }

  return (await response.json()) as T
}

function createHeaders(token?: string) {
  const headers = new Headers({
    'Content-Type': 'application/json',
  })

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

export async function fetchMeetingHistory(token: string): Promise<MeetingRecord[]> {
  const response = await fetch('/api/meetings', {
    headers: createHeaders(token),
  })
  return parseJsonResponse<MeetingRecord[]>(response)
}

export async function analyzeMeetingTranscript(
  transcript: string,
  totalCost: number,
  token: string,
): Promise<TranscriptAnalysis> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: createHeaders(token),
    body: JSON.stringify({
      transcript,
      totalCost,
    }),
  })

  return parseJsonResponse<TranscriptAnalysis>(response)
}

export async function saveMeetingRecord(
  record: MeetingRecord,
  token: string,
): Promise<MeetingRecord[]> {
  const response = await fetch('/api/meetings', {
    method: 'POST',
    headers: createHeaders(token),
    body: JSON.stringify(record),
  })

  return parseJsonResponse<MeetingRecord[]>(response)
}

export async function pingBackend(): Promise<boolean> {
  const response = await fetch('/api/health')
  return response.ok
}
