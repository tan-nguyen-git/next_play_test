import { COLUMNS, TASK_PRIORITIES } from '../constants'
import type { TaskInput, TaskPriority, TaskStatus } from '../types/task'
import { parseDateOnly } from './date'

// Must match the CHECK constraints in supabase/schema.sql.
export const TITLE_MAX_LENGTH = 200
export const DESCRIPTION_MAX_LENGTH = 2000

export function isTaskStatus(value: unknown): value is TaskStatus {
  return COLUMNS.some((column) => column.status === value)
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return TASK_PRIORITIES.some((priority) => priority === value)
}

// Raw form state: every field is what the inputs hold, so an empty due date is ''.
export interface TaskFormValues {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
}

export type TaskFormErrors = Partial<Record<'title' | 'description' | 'dueDate', string>>

export type TaskValidationResult =
  | { ok: true; input: TaskInput }
  | { ok: false; errors: TaskFormErrors }

// Shared by create and edit. Never truncates: too-long text is an error.
export function validateTaskForm(values: TaskFormValues): TaskValidationResult {
  const errors: TaskFormErrors = {}
  const title = values.title.trim()

  if (!title) {
    errors.title = 'Enter a title.'
  } else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Keep the title to ${TITLE_MAX_LENGTH} characters or fewer.`
  }

  if (values.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Keep the description to ${DESCRIPTION_MAX_LENGTH} characters or fewer.`
  }

  if (values.dueDate && !parseDateOnly(values.dueDate)) {
    errors.dueDate = 'Enter a valid date.'
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    input: {
      title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      due_date: values.dueDate || null,
    },
  }
}
