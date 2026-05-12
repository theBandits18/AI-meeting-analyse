import { requireAuth } from '../server/auth.mjs'
import { readMeetings, upsertMeeting } from '../server/storage.mjs'

function sendMethodNotAllowed(response) {
  response.status(405).json({ error: 'Method not allowed.' })
}

async function ensureAuthorized(request, response) {
  await new Promise((resolve) => {
    requireAuth(request, response, resolve)
  })

  return !response.headersSent
}

export default async function handler(request, response) {
  const isAuthorized = await ensureAuthorized(request, response)
  if (!isAuthorized) {
    return
  }

  if (request.method === 'GET') {
    const meetings = await readMeetings()
    response.status(200).json(meetings)
    return
  }

  if (request.method === 'POST') {
    const meeting = request.body

    if (!meeting || typeof meeting !== 'object' || typeof meeting.id !== 'string') {
      response.status(400).json({ error: 'A valid meeting payload is required.' })
      return
    }

    const updatedMeetings = await upsertMeeting(meeting)
    response.status(201).json(updatedMeetings)
    return
  }

  sendMethodNotAllowed(response)
}
