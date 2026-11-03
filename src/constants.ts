import type { TaskPriority, TaskStatus } from './types/task'

export interface ColumnConfig {
  status: TaskStatus
  label: string
  accent: string
}

// The single source of truth for which columns exist and their order.
export const COLUMNS: readonly ColumnConfig[] = [
  { status: 'todo', label: 'To Do', accent: '#9b6dd6' },
  { status: 'in_progress', label: 'In Progress', accent: '#d9a11e' },
  { status: 'in_review', label: 'In Review', accent: '#3b82f6' },
  { status: 'done', label: 'Done', accent: '#2f9e6b' },
]

export const TASK_PRIORITIES: readonly TaskPriority[] = ['low', 'normal', 'high']

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}
