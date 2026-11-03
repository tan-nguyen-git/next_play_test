import type { SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TaskBusyError, createTask, listTasks, updateTask } from '../services/tasks'
import type { Task, TaskInput, TaskStatus } from '../types/task'

export type TasksLoadState =
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'error'; message: string }

// Owns the canonical task list for the signed-in guest.
export function useTasks(client: SupabaseClient, userId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadState, setLoadState] = useState<TasksLoadState>({ status: 'loading' })
  // Changing this number re-runs the effect, which is how retry works.
  const [attempt, setAttempt] = useState(0)
  // IDs of tasks with a save in flight. The ref answers "is it busy?" instantly;
  // the state copy re-renders cards so they can show a saving indicator.
  const pendingRef = useRef<ReadonlySet<string>>(new Set())
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    // Set to false on cleanup so a slow, outdated response cannot overwrite
    // newer state (for example after a retry, a user change, or unmount).
    let active = true

    listTasks(client, userId).then(
      (rows) => {
        if (!active) return
        setTasks(rows)
        setLoadState({ status: 'ready' })
      },
      (error: unknown) => {
        if (import.meta.env.DEV) console.error('Loading tasks failed:', error)
        if (!active) return
        setLoadState({
          status: 'error',
          message: 'We could not load your tasks. They have not been deleted. Check your connection and try again.',
        })
      },
    )

    return () => {
      active = false
    }
  }, [client, userId, attempt])

  const retry = useCallback(() => {
    setLoadState({ status: 'loading' })
    setAttempt((count) => count + 1)
  }, [])

  const setPending = useCallback((taskId: string, isPending: boolean) => {
    const next = new Set(pendingRef.current)
    if (isPending) next.add(taskId)
    else next.delete(taskId)
    pendingRef.current = next
    setPendingIds(next)
  }, [])

  // Runs one mutation for a task, refusing to start if another is in flight.
  const runExclusive = useCallback(
    async <T,>(taskId: string, mutation: () => Promise<T>): Promise<T> => {
      if (pendingRef.current.has(taskId)) throw new TaskBusyError()
      setPending(taskId, true)
      try {
        return await mutation()
      } finally {
        setPending(taskId, false)
      }
    },
    [setPending],
  )

  const replaceTask = useCallback((updated: Task) => {
    setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)))
  }, [])

  // Saves first, then adds the row the database returned. Throws on failure
  // so the form can keep the user's input and show an error.
  const addTask = useCallback(
    async (input: TaskInput) => {
      const created = await createTask(client, userId, input)
      setTasks((current) => [...current, created])
    },
    [client, userId],
  )

  // Saves edits from the form; the board only changes after the database confirms.
  const saveTask = useCallback(
    (taskId: string, input: TaskInput) =>
      runExclusive(taskId, async () => {
        replaceTask(await updateTask(client, userId, taskId, input))
      }),
    [client, userId, runExclusive, replaceTask],
  )

  // Optimistic: moves the card immediately, then saves. On failure only this
  // task's status is restored, so other changes on the board are untouched.
  const changeStatus = useCallback(
    (taskId: string, previousStatus: TaskStatus, nextStatus: TaskStatus) =>
      runExclusive(taskId, async () => {
        const setStatus = (from: TaskStatus, to: TaskStatus) =>
          setTasks((current) =>
            current.map((task) => (task.id === taskId && task.status === from ? { ...task, status: to } : task)),
          )

        setStatus(previousStatus, nextStatus)
        try {
          replaceTask(await updateTask(client, userId, taskId, { status: nextStatus }))
        } catch (error) {
          setStatus(nextStatus, previousStatus)
          throw error
        }
      }),
    [client, userId, runExclusive, replaceTask],
  )

  return { tasks, loadState, retry, pendingIds, addTask, saveTask, changeStatus }
}
