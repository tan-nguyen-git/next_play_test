import type { SupabaseClient } from '@supabase/supabase-js'
import Board from './components/Board'
import StatusScreen from './components/StatusScreen'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
import { supabase, supabaseConfigError } from './lib/supabase'

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

  return <TaskWorkspace client={client} userId={session.userId} />
}

interface TaskWorkspaceProps {
  client: SupabaseClient
  userId: string
}

// Only rendered once a guest exists, so tasks are never requested without a session.
function TaskWorkspace({ client, userId }: TaskWorkspaceProps) {
  const { tasks, loadState, retry } = useTasks(client, userId)

  if (loadState.status === 'loading') {
    return <StatusScreen tone="loading" title="Loading your board" message="Fetching your saved tasks…" />
  }

  if (loadState.status === 'error') {
    return (
      <StatusScreen
        tone="error"
        title="Could not load your board"
        message={loadState.message}
        actionLabel="Try again"
        onAction={retry}
      />
    )
  }

  return (
    <>
      <p className="guest-badge">
        Guest <code>{userId.slice(0, 8)}</code>
      </p>
      {tasks.length === 0 && (
        <p className="board-notice" role="status">
          Your board is empty. Tasks you create will be saved to this browser’s guest board.
        </p>
      )}
      <Board tasks={tasks} />
    </>
  )
}

export default App
