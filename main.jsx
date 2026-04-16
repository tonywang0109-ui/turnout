import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { supabase } from './supabase.js'

// Storage shim: the prototype was built inside Claude's artifact runtime, which
// provides a special `window.storage` object. We recreate it here with two
// backends: Supabase for shared listings, localStorage for per-device state
// (bookings, onboarded flag). The shape matches what App.jsx expects:
// get(key) -> {value} | null, set(key, value) -> {value}, delete(key) -> {deleted}.
//
// Plus three explicit single-row methods for the Host edit/delete flow:
// insertListing, updateListing, deleteListing. These bypass the diff-based
// set() and let the app manipulate one row at a time. RLS in Supabase
// enforces ownership; the shim does not need to check.

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
        return { value: JSON.stringify(data || []) }
      }
      const v = localStorage.getItem(key)
      return v !== null ? { value: v } : null
    },

    set: async (key, value) => {
      if (key === LISTINGS_KEY) {
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
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) {
            console.error('[turnout] cannot insert listing: not signed in')
            return { value }
          }
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
        console.warn('[turnout] delete on turnout:listings is disabled by the shim. Use deleteListing(id) instead.')
        return { deleted: false }
      }
      localStorage.removeItem(key)
      return { deleted: true }
    },

    insertListing: async (spot) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[turnout] cannot insert listing: not signed in')
        return null
      }
      const { id, ...rest } = spot || {}
      const { data, error } = await supabase
        .from('listings')
        .insert({ ...rest, user_id: user.id })
        .select()
        .single()
      if (error) {
        console.error('[turnout] insert listing failed:', error.message)
        return null
      }
      return data
    },

    updateListing: async (id, patch) => {
      if (!id) return null
      const allowed = ['title', 'address', 'rate', 'type', 'available', 'description', 'lat', 'lng']
      const clean = Object.fromEntries(
        Object.entries(patch || {}).filter(([k]) => allowed.includes(k))
      )
      if (Object.keys(clean).length === 0) return null
      const { data, error } = await supabase
        .from('listings')
        .update(clean)
        .eq('id', id)
        .select()
        .single()
      if (error) {
        console.error('[turnout] update listing failed:', error.message)
        return null
      }
      return data
    },

    deleteListing: async (id) => {
      if (!id) return false
      const { error } = await supabase.from('listings').delete().eq('id', id)
      if (error) {
        console.error('[turnout] delete listing failed:', error.message)
        return false
      }
      return true
    },

    // ========================================================================
    // BOOKINGS
    // ========================================================================
    createBooking: async ({ listing_id, host_id, start_time, end_time, total_hours, total_price }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('[turnout] cannot create booking: not signed in')
        return { error: 'not_signed_in' }
      }
      if (user.id === host_id) {
        return { error: 'cannot_book_own_listing' }
      }
      // Conflict check: look for any approved booking on this listing that overlaps
      const { data: conflicts, error: conflictError } = await supabase
        .from('bookings')
        .select('id, start_time, end_time')
        .eq('listing_id', listing_id)
        .eq('status', 'approved')
        .lt('start_time', end_time)
        .gt('end_time', start_time)
      if (conflictError) {
        console.error('[turnout] conflict check failed:', conflictError.message)
        return { error: 'conflict_check_failed' }
      }
      if (conflicts && conflicts.length > 0) {
        return { error: 'time_conflict' }
      }
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          listing_id,
          renter_id: user.id,
          host_id,
          start_time,
          end_time,
          total_hours,
          total_price,
          status: 'pending',
        })
        .select()
        .single()
      if (error) {
        console.error('[turnout] create booking failed:', error.message)
        return { error: 'insert_failed', detail: error.message }
      }
      return { data }
    },

    updateBookingStatus: async (id, status) => {
      if (!id || !status) return { error: 'missing_params' }
      const allowed = ['pending', 'approved', 'declined', 'cancelled']
      if (!allowed.includes(status)) return { error: 'invalid_status' }
      const { data, error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) {
        console.error('[turnout] update booking failed:', error.message)
        return { error: 'update_failed', detail: error.message }
      }
      return { data }
    },

    fetchMyBookings: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('bookings')
        .select('*, listing:listings(*)')
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('[turnout] fetch my bookings failed:', error.message)
        return []
      }
      return data || []
    },

    fetchBookingsForHost: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      const { data, error } = await supabase
        .from('bookings')
        .select('*, listing:listings(*)')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('[turnout] fetch host bookings failed:', error.message)
        return []
      }
      return data || []
    },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
