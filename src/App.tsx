import { useEffect, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import Board from './components/Board'
import StatusScreen from './components/StatusScreen'
import TaskForm from './components/TaskForm'
import { COLUMNS } from './constants'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
import { supabase, supabaseConfigError } from './lib/supabase'
import { describeTaskError } from './services/tasks'
import type { Task, TaskInput, TaskStatus } from './types/task'
import { openButtonId, statusSelectId } from './utils/domIds'

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

type FormState = { mode: 'create'; status: TaskStatus } | { mode: 'edit'; taskId: string } | null

// Only rendered once a guest exists, so tasks are never requested without a session.
function TaskWorkspace({ client, userId }: TaskWorkspaceProps) {
  const { tasks, loadState, retry, pendingIds, addTask, saveTask, changeStatus } = useTasks(client, userId)
  const [formState, setFormState] = useState<FormState>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  // When a card moves column React remounts it, so focus would be lost.
  // This remembers which element to focus after the next render.
  const focusAfterRenderRef = useRef<string | null>(null)

  useEffect(() => {
    const id = focusAfterRenderRef.current
    if (!id) return
    focusAfterRenderRef.current = null
    document.getElementById(id)?.focus()
  }, [tasks, formState])

  const editingTask = formState?.mode === 'edit' ? tasks.find((task) => task.id === formState.taskId) : undefined

  async function handleCreate(input: TaskInput) {
    await addTask(input)
    setFormState(null)
  }

  async function handleEdit(taskId: string, input: TaskInput) {
    await saveTask(taskId, input)
    // The opener may have moved to another column; return focus to the card itself.
    focusAfterRenderRef.current = openButtonId(taskId)
    setFormState(null)
  }

  async function handleStatusChange(task: Task, status: TaskStatus) {
    setActionError(null)
    focusAfterRenderRef.current = statusSelectId(task.id)
    try {
      await changeStatus(task.id, task.status, status)
    } catch (error) {
      if (import.meta.env.DEV) console.error('Changing status failed:', error)
      focusAfterRenderRef.current = statusSelectId(task.id)
      setActionError(
        describeTaskError(
          error,
          `We could not move “${task.title}” to ${columnLabel(status)}. It is back in ${columnLabel(task.status)}.`,
        ),
      )
    }
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
        <button
          type="button"
          className="button button--primary"
          onClick={() => setFormState({ mode: 'create', status: 'todo' })}
        >
          <span aria-hidden="true">+</span> New task
        </button>
      </div>
      {actionError && (
        <div className="action-error" role="alert">
          <p>{actionError}</p>
          <button type="button" className="icon-button" aria-label="Dismiss error" onClick={() => setActionError(null)}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
      {tasks.length === 0 && (
        <p className="board-notice">
          Your board is empty. Use <strong>New task</strong> or a column’s <strong>+</strong> button to add your
          first task. Tasks are saved to this browser’s guest board.
        </p>
      )}
      <Board
        tasks={tasks}
        pendingIds={pendingIds}
        onAddTask={(status) => setFormState({ mode: 'create', status })}
        onOpenTask={(taskId) => setFormState({ mode: 'edit', taskId })}
        onStatusChange={handleStatusChange}
      />
      {formState?.mode === 'create' && (
        <TaskForm initialStatus={formState.status} onSubmit={handleCreate} onCancel={() => setFormState(null)} />
      )}
      {editingTask && (
        // key = task id: a different task gets a brand-new form with its own initial values.
        <TaskForm
          key={editingTask.id}
          task={editingTask}
          onSubmit={(input) => handleEdit(editingTask.id, input)}
          onCancel={() => {
            // Explicit, because some browsers (Safari) don't focus a button on click.
            focusAfterRenderRef.current = openButtonId(editingTask.id)
            setFormState(null)
          }}
        />
      )}
    </>
  )
}

function columnLabel(status: TaskStatus) {
  return COLUMNS.find((column) => column.status === status)?.label ?? status
}

export default App
