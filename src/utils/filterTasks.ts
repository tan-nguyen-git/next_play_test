import type { Task, TaskPriority } from '../types/task'

export interface TaskFilters {
  query: string
  priority: TaskPriority | 'all'
}

export const NO_FILTERS: TaskFilters = { query: '', priority: 'all' }

export function hasActiveFilters(filters: TaskFilters): boolean {
  return filters.query.trim() !== '' || filters.priority !== 'all'
}

// Case-insensitive title match plus an optional priority.
export function matchesFilters(task: Task, filters: TaskFilters): boolean {
  const query = filters.query.trim().toLocaleLowerCase()
  if (query && !task.title.toLocaleLowerCase().includes(query)) return false
  if (filters.priority !== 'all' && task.priority !== filters.priority) return false
  return true
}

// Returns a new array; the saved task list is never modified.
export function filterTasks(tasks: readonly Task[], filters: TaskFilters): Task[] {
  if (!hasActiveFilters(filters)) return [...tasks]
  return tasks.filter((task) => matchesFilters(task, filters))
}
