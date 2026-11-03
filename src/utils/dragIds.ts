import type { TaskStatus } from '../types/task'
import { isTaskStatus } from './taskValidation'

// Draggable cards and droppable columns use prefixed IDs, so a card's UUID can
// never be mistaken for a column status (or the other way around).
const TASK_PREFIX = 'task:'
const COLUMN_PREFIX = 'column:'

export function taskDragId(taskId: string) {
  return `${TASK_PREFIX}${taskId}`
}

export function columnDropId(status: TaskStatus) {
  return `${COLUMN_PREFIX}${status}`
}

export function parseTaskDragId(id: string | number): string | null {
  const value = String(id)
  return value.startsWith(TASK_PREFIX) ? value.slice(TASK_PREFIX.length) : null
}

export function parseColumnDropId(id: string | number): TaskStatus | null {
  const value = String(id)
  if (!value.startsWith(COLUMN_PREFIX)) return null
  const status = value.slice(COLUMN_PREFIX.length)
  return isTaskStatus(status) ? status : null
}
