import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export async function requireAuth(request, response, next) {
  if (!supabase) {
    response.status(503).json({
      error:
        'Supabase is not configured on the server. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY first.',
    })
    return
  }

  const authorization = request.headers.authorization
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : null

  if (!token) {
    response.status(401).json({ error: 'Authentication required.' })
    return
  }

  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    response.status(401).json({ error: 'Authentication required.' })
    return
  }

  request.user = {
    id: data.user.id,
    email: data.user.email ?? '',
  }
  next()
}
