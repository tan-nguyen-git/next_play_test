import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import Board from './components/Board'
import StatusScreen from './components/StatusScreen'
import { useGuestSession } from './hooks/useGuestSession'
import { supabase, supabaseConfigError } from './lib/supabase'
import type { Task } from './types/task'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" aria-hidden="true" />
          <h1 className="app-header__title">Task Board</h1>
        </div>
      </header>
      <main className="app-main">
        {supabase ? (
          <GuestWorkspace client={supabase} />
        ) : (
          <StatusScreen
            tone="error"
            title="App configuration is missing"
            message={supabaseConfigError ?? 'Supabase is not configured.'}
          />
        )}
      </main>
    </div>
  )
}

interface GuestWorkspaceProps {
  client: SupabaseClient
}

// Gates the board behind a ready guest session. No task work happens before that.
function GuestWorkspace({ client }: GuestWorkspaceProps) {
  const { session, retry } = useGuestSession(client)
  // Canonical task list. Stays empty until Task 5 loads it from Supabase.
  const [tasks] = useState<Task[]>([])

  if (session.status === 'loading') {
    return (
      <StatusScreen
        tone="loading"
        title="Starting your guest session"
        message="Setting up a private board for this browser…"
      />
    )
  }

  if (session.status === 'error') {
    return (
      <StatusScreen
        tone="error"
        title="Could not start your session"
        message={session.message}
        actionLabel="Try again"
        onAction={retry}
      />
    )
  }

  return (
    <>
      <p className="guest-badge">
        Guest <code>{session.userId.slice(0, 8)}</code>
      </p>
      <Board tasks={tasks} />
    </>
  )
}

export default App
