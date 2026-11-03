import type { Task } from '../types/task'
import { getDueState } from './date'

export interface BoardSummaryCounts {
  total: number
  completed: number
  overdue: number
}

// Counts for every loaded task, regardless of any filters shown on screen.
export function summarizeTasks(tasks: readonly Task[], today: Date): BoardSummaryCounts {
  let completed = 0
  let overdue = 0
  for (const task of tasks) {
    if (task.status === 'done') completed += 1
    else if (getDueState(task.due_date, false, today) === 'overdue') overdue += 1
  }
  return { total: tasks.length, completed, overdue }
}
