import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { supabase } from './supabase.js'

const LISTINGS_KEY = 'turnout:listings'

// Wrap any promise with a timeout so hanging Supabase calls don't freeze the UI.
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => {
      console.error(`[turnout] ${label} timed out after ${ms}ms`)
      resolve({ data: null, error: { message: `timeout:${label}` } })
    }, ms)),
  ])
}

async function getCurrentUser() {
  try {
    const { data: { session } } = await withTimeout(
      supabase.auth.getSession(),
      5000,
      'getSession'
    )
    return session?.user || null
  } catch (err) {
    console.error('[turnout] getCurrentUser failed:', err)
    return null
  }
}

if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: async (key) => {
      if (key === LISTINGS_KEY) {
        const { data, error } = await withTimeout(
          supabase.from('listings').select('*').order('created_at', { ascending: true }),
          10000,
          'listings.select'
        )
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
          const user = await getCurrentUser()
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
      const user = await getCurrentUser()
      if (!user) {
        console.error('[turnout] cannot insert listing: not signed in')
        return null
      }
      const { id, ...rest } = spot || {}
      const { data, error } = await withTimeout(
        supabase.from('listings').insert({ ...rest, user_id: user.id }).select().single(),
        10000,
        'listings.insert'
      )
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
      const { data, error } = await withTimeout(
        supabase.from('listings').update(clean).eq('id', id).select().single(),
        10000,
        'listings.update'
      )
      if (error) {
        console.error('[turnout] update listing failed:', error.message)
        return null
      }
      return data
    },

    deleteListing: async (id) => {
      if (!id) return false
      const { error } = await withTimeout(
        supabase.from('listings').delete().eq('id', id),
        10000,
        'listings.delete'
      )
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
      console.log('[turnout] createBooking start', { listing_id, host_id })
      const user = await getCurrentUser()
      console.log('[turnout] got user:', user?.id)
      if (!user) return { error: 'not_signed_in' }
      if (user.id === host_id) return { error: 'cannot_book_own_listing' }

      console.log('[turnout] checking conflicts...')
      const { data: conflicts, error: conflictError } = await withTimeout(
        supabase
          .from('bookings')
          .select('id, start_time, end_time')
          .eq('listing_id', listing_id)
          .eq('status', 'approved')
          .lt('start_time', end_time)
          .gt('end_time', start_time),
        8000,
        'bookings.conflict-check'
      )
      console.log('[turnout] conflict check done', { conflicts, conflictError })
      if (conflictError) {
        return { error: 'conflict_check_failed', detail: conflictError.message }
      }
      if (conflicts && conflicts.length > 0) {
        return { error: 'time_conflict' }
      }
      console.log('[turnout] inserting booking...')
      const { data, error } = await withTimeout(
        supabase.from('bookings').insert({
          listing_id,
          renter_id: user.id,
          host_id,
          start_time,
          end_time,
          total_hours,
          total_price,
          status: 'pending',
        }).select().single(),
        8000,
        'bookings.insert'
      )
      console.log('[turnout] insert done', { data, error })
      if (error) {
        return { error: 'insert_failed', detail: error.message }
      }
      return { data }
    },

    updateBookingStatus: async (id, status) => {
      if (!id || !status) return { error: 'missing_params' }
      const allowed = ['pending', 'approved', 'declined', 'cancelled']
      if (!allowed.includes(status)) return { error: 'invalid_status' }
      const { data, error } = await withTimeout(
        supabase.from('bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
        8000,
        'bookings.update-status'
      )
      if (error) {
        console.error('[turnout] update booking failed:', error.message)
        return { error: 'update_failed', detail: error.message }
      }
      return { data }
    },

    fetchMyBookings: async () => {
      console.log('[turnout] fetchMyBookings start')
      const user = await getCurrentUser()
      console.log('[turnout] fetchMyBookings user:', user?.id)
      if (!user) return []
      const { data, error } = await withTimeout(
        supabase.from('bookings').select('*, listing:listings(*)').eq('renter_id', user.id).order('created_at', { ascending: false }),
        8000,
        'bookings.fetch-renter'
      )
      console.log('[turnout] fetchMyBookings done', { count: data?.length, error })
      if (error) return []
      return data || []
    },

    fetchBookingsForHost: async () => {
      console.log('[turnout] fetchBookingsForHost start')
      const user = await getCurrentUser()
      console.log('[turnout] fetchBookingsForHost user:', user?.id)
      if (!user) return []
      const { data, error } = await withTimeout(
        supabase.from('bookings').select('*, listing:listings(*)').eq('host_id', user.id).order('created_at', { ascending: false }),
        8000,
        'bookings.fetch-host'
      )
      console.log('[turnout] fetchBookingsForHost done', { count: data?.length, error })
      if (error) return []
      return data || []
    },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
