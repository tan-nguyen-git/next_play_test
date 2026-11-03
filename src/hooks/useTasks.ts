import type { SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { listTasks } from '../services/tasks'
import type { Task } from '../types/task'

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

  return { tasks, loadState, retry }
}
