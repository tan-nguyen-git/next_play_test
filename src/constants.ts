import type { TaskPriority, TaskStatus } from './types/task'

export interface ColumnConfig {
  status: TaskStatus
  label: string
  accent: string
}

// The single source of truth for which columns exist and their order.
export const COLUMNS: readonly ColumnConfig[] = [
  { status: 'todo', label: 'To Do', accent: '#8a94a6' },
  { status: 'in_progress', label: 'In Progress', accent: '#4f6bed' },
  { status: 'in_review', label: 'In Review', accent: '#b7791f' },
  { status: 'done', label: 'Done', accent: '#2f9e6b' },
]

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}
