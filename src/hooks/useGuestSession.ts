import { isAuthError, type SupabaseClient, type User } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'

export type GuestSessionState =
  | { status: 'loading' }
  | { status: 'ready'; userId: string }
  | { status: 'error'; message: string }

// Shared across every caller so React StrictMode (which mounts effects twice
// in development) cannot trigger two anonymous sign-ins at once.
let initialization: Promise<User> | null = null

async function restoreOrCreateGuest(client: SupabaseClient): Promise<User> {
  // 1. Reuse the session saved in this browser, if any.
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  if (data.session) return data.session.user

  // 2. No session yet: create a new anonymous guest.
  const signIn = await client.auth.signInAnonymously()
  if (signIn.error) throw signIn.error
  if (!signIn.data.user) throw new Error('Anonymous sign-in returned no user.')
  return signIn.data.user
}

function initializeGuest(client: SupabaseClient): Promise<User> {
  if (!initialization) {
    initialization = restoreOrCreateGuest(client).catch((error: unknown) => {
      // Forget the failed attempt so a manual retry can start a fresh one.
      initialization = null
      throw error
    })
  }
  return initialization
}

function toUserMessage(error: unknown): string {
  if (isAuthError(error) && error.code === 'anonymous_provider_disabled') {
    return 'Guest sign-in is turned off for this Supabase project. Enable anonymous sign-ins in the Supabase dashboard, then try again.'
  }
  // Supabase limits how many new guests one network can create per hour.
  if (isAuthError(error) && (error.code === 'over_request_rate_limit' || error.status === 429)) {
    return 'Too many new guest sessions were started from this network recently. Please wait a few minutes, then try again.'
  }
  return 'We could not start your guest session. Check your connection and try again.'
}

export function useGuestSession(client: SupabaseClient) {
  const [state, setState] = useState<GuestSessionState>({ status: 'loading' })
  // Changing this number re-runs the effect, which is how retry works.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Ignore the result if this effect was cleaned up before it finished.
    let active = true

    initializeGuest(client).then(
      (user) => {
        if (active) setState({ status: 'ready', userId: user.id })
      },
      (error: unknown) => {
        // Error objects carry no tokens; log details only during development.
        if (import.meta.env.DEV) console.error('Guest session initialization failed:', error)
        if (active) setState({ status: 'error', message: toUserMessage(error) })
      },
    )

    return () => {
      active = false
    }
  }, [client, attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((count) => count + 1)
  }, [])

  return { session: state, retry }
}
