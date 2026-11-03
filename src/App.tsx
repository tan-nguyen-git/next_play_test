import { useEffect, useMemo, useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import Board from './components/Board'
import BoardSummary from './components/BoardSummary'
import BoardToolbar from './components/BoardToolbar'
import StatusScreen from './components/StatusScreen'
import TaskForm from './components/TaskForm'
import { COLUMNS } from './constants'
import { useGuestSession } from './hooks/useGuestSession'
import { useTasks } from './hooks/useTasks'
import { useToday } from './hooks/useToday'
import { supabase, supabaseConfigError } from './lib/supabase'
import { describeTaskError } from './services/tasks'
import type { Task, TaskInput, TaskStatus } from './types/task'
import { openButtonId, statusSelectId } from './utils/domIds'
import { filterTasks, hasActiveFilters, matchesFilters, NO_FILTERS, type TaskFilters } from './utils/filterTasks'
import { summarizeTasks } from './utils/taskStats'

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

const NEW_TASK_BUTTON_ID = 'new-task-button'

type FormState = { mode: 'create'; status: TaskStatus } | { mode: 'edit'; taskId: string } | null

// Only rendered once a guest exists, so tasks are never requested without a session.
function TaskWorkspace({ client, userId }: TaskWorkspaceProps) {
  const { tasks, loadState, retry, pendingIds, addTask, saveTask, changeStatus, removeTask } = useTasks(client, userId)
  const [formState, setFormState] = useState<FormState>(null)
  const today = useToday()
  const [actionError, setActionError] = useState<string | null>(null)
  // Polite screen reader message for actions with no other visible confirmation.
  const [announcement, setAnnouncement] = useState('')
  const [filters, setFilters] = useState<TaskFilters>(NO_FILTERS)
  // Shown when a newly created task is hidden by the active filters.
  const [hiddenTaskNotice, setHiddenTaskNotice] = useState<string | null>(null)
  // When a card moves column React remounts it, so focus would be lost.
  // This remembers which element to focus after the next render.
  const focusAfterRenderRef = useRef<string | null>(null)

  useEffect(() => {
    const id = focusAfterRenderRef.current
    if (!id) return
    focusAfterRenderRef.current = null
    document.getElementById(id)?.focus()
  }, [tasks, formState])

  // Looked up in the full list, so a task stays editable even if filters hide it.
  const editingTask = formState?.mode === 'edit' ? tasks.find((task) => task.id === formState.taskId) : undefined
  const filtering = hasActiveFilters(filters)
  // Derived from the one saved list on each change; never stored separately.
  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters])

  function handleFiltersChange(next: TaskFilters) {
    setFilters(next)
    setHiddenTaskNotice(null)
  }

  async function handleCreate(input: TaskInput) {
    const created = await addTask(input)
    setFormState(null)
    if (!matchesFilters(created, filters)) {
      setHiddenTaskNotice(`“${created.title}” was saved but is hidden by the current filters.`)
    }
  }

  async function handleEdit(taskId: string, input: TaskInput) {
    await saveTask(taskId, input)
    // The opener may have moved to another column; return focus to the card itself.
    focusAfterRenderRef.current = openButtonId(taskId)
    setFormState(null)
  }

  async function handleDelete(task: Task) {
    await removeTask(task.id)
    // The card is gone, so send focus somewhere stable.
    focusAfterRenderRef.current = NEW_TASK_BUTTON_ID
    setAnnouncement(`Deleted “${task.title}”.`)
    setFormState(null)
  }

  // Used by both the status selector and drag-and-drop. Only the selector
  // (keyboard-friendly) keeps focus on the card after it moves column.
  async function handleStatusChange(task: Task, status: TaskStatus, keepFocus = true) {
    setActionError(null)
    if (keepFocus) focusAfterRenderRef.current = statusSelectId(task.id)
    try {
      await changeStatus(task.id, task.status, status)
    } catch (error) {
      if (import.meta.env.DEV) console.error('Changing status failed:', error)
      if (keepFocus) focusAfterRenderRef.current = statusSelectId(task.id)
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
        <BoardSummary counts={summarizeTasks(tasks, today)} />
        <button
          id={NEW_TASK_BUTTON_ID}
          type="button"
          className="button button--primary"
          onClick={() => setFormState({ mode: 'create', status: 'todo' })}
        >
          <span aria-hidden="true">+</span> New task
        </button>
      </div>
      <BoardToolbar filters={filters} onChange={handleFiltersChange} />
      {filtering && tasks.length > 0 && (
        <p className="filter-status" role="status">
          Showing {visibleTasks.length} of {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}. Column counts show
          matching tasks only.
        </p>
      )}
      <p className="visually-hidden" role="status">
        {announcement}
      </p>
      {actionError && (
        <div className="action-error" role="alert">
          <p>{actionError}</p>
          <button type="button" className="icon-button" aria-label="Dismiss error" onClick={() => setActionError(null)}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
      {hiddenTaskNotice && (
        <div className="board-notice board-notice--action">
          <p>{hiddenTaskNotice}</p>
          <button type="button" className="button button--secondary" onClick={() => handleFiltersChange(NO_FILTERS)}>
            Clear filters
          </button>
        </div>
      )}
      {tasks.length === 0 ? (
        <p className="board-notice">
          Your board is empty. Use <strong>New task</strong> or a column’s <strong>+</strong> button to add your
          first task. Tasks are saved to this browser’s guest board.
        </p>
      ) : (
        visibleTasks.length === 0 && (
          <div className="board-notice board-notice--action">
            <p>No tasks match your search and filters. Your tasks are still saved.</p>
            <button type="button" className="button button--secondary" onClick={() => handleFiltersChange(NO_FILTERS)}>
              Clear filters
            </button>
          </div>
        )
      )}
      <Board
        tasks={visibleTasks}
        filtering={filtering}
        today={today}
        pendingIds={pendingIds}
        onAddTask={(status) => setFormState({ mode: 'create', status })}
        onOpenTask={(taskId) => setFormState({ mode: 'edit', taskId })}
        onStatusChange={handleStatusChange}
        onDropTask={(task, status) => handleStatusChange(task, status, false)}
      />
      <footer className="guest-note">
        <p>
          <strong>Guest board.</strong> Your tasks are saved to your account on this browser. Clearing this site’s data
          or closing a private window ends the guest session, and this board cannot be recovered.
        </p>
        <p className="guest-note__id">
          Guest ID <code>{userId.slice(0, 8)}</code>
        </p>
      </footer>
      {formState?.mode === 'create' && (
        <TaskForm initialStatus={formState.status} onSubmit={handleCreate} onCancel={() => setFormState(null)} />
      )}
      {editingTask && (
        // key = task id: a different task gets a brand-new form with its own initial values.
        <TaskForm
          key={editingTask.id}
          task={editingTask}
          onSubmit={(input) => handleEdit(editingTask.id, input)}
          onDelete={() => handleDelete(editingTask)}
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
