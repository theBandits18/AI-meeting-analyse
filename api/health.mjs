import { isSupabaseConfigured } from '../server/auth.mjs'

export default function handler(_request, response) {
  response.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    authProvider: 'supabase',
    configured: isSupabaseConfigured(),
  })
}
