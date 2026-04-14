// Supabase client for Turnout.
// Reads credentials from Vercel environment variables (set in Project Settings).
// Both must be prefixed with VITE_ so Vite exposes them to the browser bundle.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error(
    '[turnout] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
    'Check Vercel env vars and redeploy.'
  )
}

export const supabase = createClient(url, key)
