import express from 'express'
import { analyzeTranscript } from './analysis.mjs'
import { isSupabaseConfigured, requireAuth } from './auth.mjs'
import { readMeetings, upsertMeeting } from './storage.mjs'

const app = express()
const port = Number(process.env.PORT ?? 8787)

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    authProvider: 'supabase',
    configured: isSupabaseConfigured(),
  })
})

app.get('/api/auth/session', requireAuth, (request, response) => {
  response.json({
    user: request.user,
  })
})

app.use('/api/meetings', requireAuth)
app.use('/api/analyze', requireAuth)

app.get('/api/meetings', async (_request, response) => {
  const meetings = await readMeetings()
  response.json(meetings)
})

app.post('/api/analyze', (request, response) => {
  const { transcript, totalCost } = request.body ?? {}

  if (typeof transcript !== 'string' || !transcript.trim()) {
    response.status(400).json({ error: 'Transcript text is required.' })
    return
  }

  if (typeof totalCost !== 'number' || Number.isNaN(totalCost)) {
    response.status(400).json({ error: 'A numeric totalCost value is required.' })
    return
  }

  response.json(analyzeTranscript(transcript, totalCost))
})

app.post('/api/meetings', async (request, response) => {
  const meeting = request.body

  if (!meeting || typeof meeting !== 'object' || typeof meeting.id !== 'string') {
    response.status(400).json({ error: 'A valid meeting payload is required.' })
    return
  }

  const updatedMeetings = await upsertMeeting(meeting)
  response.status(201).json(updatedMeetings)
})

app.listen(port, () => {
  console.log(`Meeting backend listening on http://localhost:${port}`)
  console.log(`Supabase auth configured: ${isSupabaseConfigured() ? 'yes' : 'no'}`)
})
