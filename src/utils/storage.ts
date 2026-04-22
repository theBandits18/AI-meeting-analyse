import { STORAGE_KEY } from '../constants'
import type { MeetingRecord } from '../types'

export function loadMeetingHistory(): MeetingRecord[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as MeetingRecord[]
    return parsed.sort(
      (left, right) =>
        new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
    )
  } catch {
    return []
  }
}

export function upsertMeetingRecord(
  existingRecords: MeetingRecord[],
  nextRecord: MeetingRecord,
) {
  const updatedRecords = [
    nextRecord,
    ...existingRecords.filter((record) => record.id !== nextRecord.id),
  ].sort(
    (left, right) =>
      new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
  )

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords))

  return updatedRecords
}

export function replaceMeetingHistory(records: MeetingRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}
