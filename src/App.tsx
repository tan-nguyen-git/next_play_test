import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import Board from './components/Board'
import StatusScreen from './components/StatusScreen'
import TaskForm from './components/TaskForm'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
import { supabase, supabaseConfigError } from './lib/supabase'
import type { TaskInput, TaskStatus } from './types/task'

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
  const { tasks, loadState, retry, addTask } = useTasks(client, userId)
  // null = no form open. Otherwise, which column the new task starts in.
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null)

  async function handleCreate(input: TaskInput) {
    await addTask(input)
    setCreateStatus(null)
  }

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
      <div className="workspace-toolbar">
        <p className="guest-badge">
          Guest <code>{userId.slice(0, 8)}</code>
        </p>
        <button type="button" className="button button--primary" onClick={() => setCreateStatus('todo')}>
          <span aria-hidden="true">+</span> New task
        </button>
      </div>
      {tasks.length === 0 && (
        <p className="board-notice">
          Your board is empty. Use <strong>New task</strong> or a column’s <strong>+</strong> button to add your
          first task. Tasks are saved to this browser’s guest board.
        </p>
      )}
      <Board tasks={tasks} onAddTask={setCreateStatus} />
      {createStatus && (
        <TaskForm initialStatus={createStatus} onSubmit={handleCreate} onCancel={() => setCreateStatus(null)} />
      )}
    </>
  )
}

export default App
