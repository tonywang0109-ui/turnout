import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { supabase } from './supabase.js'

const LISTINGS_KEY = 'turnout:listings'
const PHOTOS_BUCKET = 'listing-photos'

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

// Fetch emails for a list of user IDs via the get_user_emails RPC.
// Returns a map of { userId: email }.
async function fetchEmailsForUsers(userIds) {
  if (!userIds || userIds.length === 0) return {}
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('get_user_emails', { user_ids: userIds }),
      5000,
      'rpc.get_user_emails'
    )
    if (error) {
      console.error('[turnout] get_user_emails failed:', error.message)
      return {}
    }
    const map = {}
    ;(data || []).forEach(row => { map[row.id] = row.email })
    return map
  } catch (err) {
    console.error('[turnout] fetchEmailsForUsers error:', err)
    return {}
  }
}

// Compress an image client-side before upload. Resizes so the longest side is
// at most `maxSize` pixels and re-encodes as JPEG at `quality`. Keeps uploads
// fast on cellular and storage costs low. Returns a Blob.
async function compressImage(file, { maxSize = 1600, quality = 0.82 } = {}) {
  if (!file) throw new Error('No file provided')
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const { width, height } = img
        const scale = Math.min(1, maxSize / Math.max(width, height))
        const w = Math.max(1, Math.round(width * scale))
        const h = Math.max(1, Math.round(height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url)
            if (!blob) return reject(new Error('Image encoding failed'))
            resolve(blob)
          },
          'image/jpeg',
          quality
        )
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Couldn't read that image. HEIC photos from iPhone may need to be exported as JPEG first."))
    }
    img.src = url
  })
}

// Extract the storage object path (user_id/filename) from a public URL.
// Returns null if the URL doesn't match the listing-photos bucket.
function pathFromPhotoUrl(url) {
  if (!url || typeof url !== 'string') return null
  const marker = `/storage/v1/object/public/${PHOTOS_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  return url.slice(idx + marker.length)
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
      const allowed = ['title', 'address', 'rate', 'type', 'available', 'description', 'lat', 'lng', 'photos']
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
    // PHOTO UPLOAD / DELETE
    // ========================================================================
    // Compresses `file` client-side, uploads to the `listing-photos` bucket
    // under {user_id}/<timestamp>-<random>.jpg, and returns the public URL.
    // Returns null on failure (caller shows the error in UI).
    uploadListingPhoto: async (file) => {
      if (!file) return null
      const user = await getCurrentUser()
      if (!user) {
        console.error('[turnout] cannot upload photo: not signed in')
        throw new Error('You need to sign in before uploading photos.')
      }
      let blob
      try {
        blob = await compressImage(file, { maxSize: 1600, quality: 0.82 })
      } catch (err) {
        console.warn('[turnout] image compression failed:', err)
        throw err
      }
      const rand = Math.random().toString(36).slice(2, 10)
      const filename = `${Date.now()}-${rand}.jpg`
      const path = `${user.id}/${filename}`
      const { error: upErr } = await withTimeout(
        supabase.storage.from(PHOTOS_BUCKET).upload(path, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        }),
        20000,
        'storage.upload'
      )
      if (upErr) {
        console.error('[turnout] photo upload failed:', upErr.message || upErr)
        throw new Error(upErr.message || 'Upload failed')
      }
      const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path)
      return data?.publicUrl || null
    },

    // Best-effort delete of a photo from storage given its public URL.
    // Doesn't throw — if the file is already gone, that's fine.
    deleteListingPhoto: async (url) => {
      const path = pathFromPhotoUrl(url)
      if (!path) return false
      const { error } = await withTimeout(
        supabase.storage.from(PHOTOS_BUCKET).remove([path]),
        8000,
        'storage.delete'
      )
      if (error) {
        console.warn('[turnout] photo delete failed:', error.message || error)
        return false
      }
      return true
    },

    // ========================================================================
    // BOOKINGS
    // ========================================================================
    createBooking: async ({ listing_id, host_id, start_time, end_time, total_hours, total_price }) => {
      const user = await getCurrentUser()
      if (!user) return { error: 'not_signed_in' }
      if (user.id === host_id) return { error: 'cannot_book_own_listing' }

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
      if (conflictError) {
        return { error: 'conflict_check_failed', detail: conflictError.message }
      }
      if (conflicts && conflicts.length > 0) {
        return { error: 'time_conflict' }
      }
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
      if (error) {
        return { error: 'insert_failed', detail: error.message }
      }
      return { data }
    },

    // updateBookingStatus now accepts an optional `extra` object.
    // When approving, the host can pass { host_contact: {...} } to share
    // contact/payment info with the renter. Pass null to clear previous value.
    updateBookingStatus: async (id, status, extra = null) => {
      if (!id || !status) return { error: 'missing_params' }
      const allowed = ['pending', 'approved', 'declined', 'cancelled']
      if (!allowed.includes(status)) return { error: 'invalid_status' }
      const payload = { status, updated_at: new Date().toISOString() }
      if (extra && typeof extra === 'object' && 'host_contact' in extra) {
        payload.host_contact = extra.host_contact
      }
      const { data, error } = await withTimeout(
        supabase.from('bookings').update(payload).eq('id', id).select().single(),
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
      const user = await getCurrentUser()
      if (!user) return []
      const { data, error } = await withTimeout(
        supabase.from('bookings').select('*, listing:listings(*)').eq('renter_id', user.id).order('created_at', { ascending: false }),
        8000,
        'bookings.fetch-renter'
      )
      if (error) return []
      if (!data || data.length === 0) return []
      // Enrich with host emails for approved bookings
      const approvedHostIds = Array.from(new Set(data.filter(b => b.status === 'approved').map(b => b.host_id)))
      const emails = await fetchEmailsForUsers(approvedHostIds)
      return data.map(b => ({ ...b, _counterparty_email: emails[b.host_id] || null }))
    },

    fetchBookingsForHost: async () => {
      const user = await getCurrentUser()
      if (!user) return []
      const { data, error } = await withTimeout(
        supabase.from('bookings').select('*, listing:listings(*)').eq('host_id', user.id).order('created_at', { ascending: false }),
        8000,
        'bookings.fetch-host'
      )
      if (error) return []
      if (!data || data.length === 0) return []
      // Enrich with renter emails for approved bookings
      const approvedRenterIds = Array.from(new Set(data.filter(b => b.status === 'approved').map(b => b.renter_id)))
      const emails = await fetchEmailsForUsers(approvedRenterIds)
      return data.map(b => ({ ...b, _counterparty_email: emails[b.renter_id] || null }))
    },
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
