import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, 'data')
const DATA_FILE = path.join(DATA_DIR, 'meetings.json')

async function ensureStorage() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    await readFile(DATA_FILE, 'utf8')
  } catch {
    await writeFile(DATA_FILE, '[]', 'utf8')
  }
}

export async function readMeetings() {
  await ensureStorage()
  const raw = await readFile(DATA_FILE, 'utf8')

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function writeMeetings(meetings) {
  await ensureStorage()
  await writeFile(DATA_FILE, JSON.stringify(meetings, null, 2), 'utf8')
}

export async function upsertMeeting(meeting) {
  const meetings = await readMeetings()
  const updatedMeetings = [
    meeting,
    ...meetings.filter((entry) => entry.id !== meeting.id),
  ].sort(
    (left, right) =>
      new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime(),
  )

  await writeMeetings(updatedMeetings)
  return updatedMeetings
}
