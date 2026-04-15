import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { supabase } from './supabase.js'

// Storage shim: the prototype was built inside Claude's artifact runtime, which
// provides a special `window.storage` object. We recreate it here with two
// backends: Supabase for shared listings, localStorage for per-device state
// (bookings, onboarded flag). The shape matches what App.jsx expects:
// get(key) -> {value} | null, set(key, value) -> {value}, delete(key) -> {deleted}.

const LISTINGS_KEY = 'turnout:listings'

if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      if (key === LISTINGS_KEY) {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .order('created_at', { ascending: true })
        if (error) {
          console.error('[turnout] supabase read failed:', error.message)
          return { value: '[]' }
        }
        // App.jsx expects a string it will JSON.parse, so we stringify here
        // to match the original localStorage contract exactly.
        return { value: JSON.stringify(data || []) }
      }
      const v = localStorage.getItem(key)
      return v !== null ? { value: v } : null
    },

    set: async (key, value) => {
      if (key === LISTINGS_KEY) {
        // Accept either a JSON string (App.jsx stringifies before calling) or
        // a raw array (defensive). Figure out what's new and insert only those.
        let incoming = []
        try {
          if (typeof value === 'string') incoming = JSON.parse(value)
          else if (Array.isArray(value)) incoming = value
        } catch (e) {
          console.error('[turnout] could not parse listings payload:', e)
          return { value }
        }

        const { data: existing } = await supabase.from('listings').select('id')
        const existingIds = new Set((existing || []).map((r) => r.id))
        const toInsert = (incoming || []).filter(
          (l) => !l.id || !existingIds.has(l.id)
        )

        if (toInsert.length > 0) {
          // RLS requires user_id = auth.uid() on insert. Stamp it here so
          // App.jsx never has to think about it. If no session, fail loudly
          // — App.jsx is supposed to gate the Host flow behind login first.
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            console.error('[turnout] cannot insert listing: not signed in')
            return { value }
          }
          // Strip client-generated ids so Supabase generates real UUIDs.
          const rows = toInsert.map(({ id, ...rest }) => ({ ...rest, user_id: user.id }))
          const { error } = await supabase.from('listings').insert(rows)
          if (error) console.error('[turnout] supabase insert failed:', error.message)
        }
        return { value }
      }
      localStorage.setItem(key, String(value))
      return { value }
    },

    delete: async (key) => {
      if (key === LISTINGS_KEY) {
        // Refuse to nuke the whole table via the shim. If you need to clear
        // listings, do it in the Supabase SQL Editor.
        console.warn('[turnout] delete on turnout:listings is disabled by the shim')
        return { deleted: false }
      }
      localStorage.removeItem(key)
      return { deleted: true }
    },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
