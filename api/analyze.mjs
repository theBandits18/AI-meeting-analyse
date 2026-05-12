import { analyzeTranscript } from '../server/analysis.mjs'
import { requireAuth } from '../server/auth.mjs'

function sendMethodNotAllowed(response) {
  response.status(405).json({ error: 'Method not allowed.' })
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    sendMethodNotAllowed(response)
    return
  }

  await new Promise((resolve) => {
    requireAuth(request, response, resolve)
  })

  if (response.headersSent) {
    return
  }

  const { transcript, totalCost } = request.body ?? {}

  if (typeof transcript !== 'string' || !transcript.trim()) {
    response.status(400).json({ error: 'Transcript text is required.' })
    return
  }

  if (typeof totalCost !== 'number' || Number.isNaN(totalCost)) {
    response.status(400).json({ error: 'A numeric totalCost value is required.' })
    return
  }

  response.status(200).json(analyzeTranscript(transcript, totalCost))
}
