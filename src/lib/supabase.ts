import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Both values are PUBLIC: Vite bundles them into the browser code.
// Data is protected by Row Level Security, not by hiding these.
const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? ''

function findConfigError(): string | null {
  if (!url || !anonKey) {
    return 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must both be set. Copy .env.example to .env.local, fill in your Supabase project values, and restart the dev server.'
  }
  if (url.includes('your-project-ref') || anonKey.includes('your-public-anon-key')) {
    return '.env.local still contains the placeholder values from .env.example. Replace them with your Supabase project URL and public anon key, then restart the dev server.'
  }
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return 'VITE_SUPABASE_URL must start with https://.'
    }
    // supabase-js adds /rest/v1, /auth/v1, etc. itself, so the URL must be the bare project URL.
    if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
      return `VITE_SUPABASE_URL should be just the project URL, like https://your-project-ref.supabase.co, without "${parsed.pathname}" at the end. Fix .env.local and restart the dev server.`
    }
  } catch {
    return 'VITE_SUPABASE_URL is not a valid URL. It should look like https://your-project-ref.supabase.co.'
  }
  return null
}

export const supabaseConfigError = findConfigError()

// The single shared client for the whole app; null when configuration is invalid.
// It stores the session in localStorage and refreshes the access token automatically.
export const supabase: SupabaseClient | null = supabaseConfigError ? null : createClient(url, anonKey)
