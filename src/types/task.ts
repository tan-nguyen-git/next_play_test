// These string unions match the values allowed by the database constraints.
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'

export type TaskPriority = 'low' | 'normal' | 'high'

// One row of the public.tasks table. Timestamps and dates stay as strings
// at the database boundary; they are only converted when displayed or compared.
export interface Task {
  id: string
  title: string
  status: TaskStatus
  user_id: string
  created_at: string
  description: string
  priority: TaskPriority
  due_date: string | null
}

// The fields a user may provide when creating or editing a task.
// id, user_id, and created_at are deliberately absent: the database and
// the current session decide those, never form input.
export interface TaskInput {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
}
