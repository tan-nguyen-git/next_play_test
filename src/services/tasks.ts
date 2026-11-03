import type { SupabaseClient } from '@supabase/supabase-js'
import { COLUMNS, TASK_PRIORITIES } from '../constants'
import type { Task, TaskPriority, TaskStatus } from '../types/task'

// Request exactly the columns the Task type describes.
const TASK_COLUMNS = 'id, title, status, user_id, created_at, description, priority, due_date'

function isTaskStatus(value: unknown): value is TaskStatus {
  return COLUMNS.some((column) => column.status === value)
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return TASK_PRIORITIES.some((priority) => priority === value)
}

// TypeScript types disappear at runtime, so check each row before trusting it.
function parseTask(row: unknown): Task {
  if (typeof row !== 'object' || row === null) {
    throw new Error('Task row is not an object.')
  }
  const field = (key: string): unknown => Reflect.get(row, key)

  const id = field('id')
  const title = field('title')
  const status = field('status')
  const userId = field('user_id')
  const createdAt = field('created_at')
  const description = field('description')
  const priority = field('priority')
  const dueDate = field('due_date')

  if (
    typeof id !== 'string' ||
    typeof title !== 'string' ||
    !isTaskStatus(status) ||
    typeof userId !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof description !== 'string' ||
    !isTaskPriority(priority) ||
    (dueDate !== null && typeof dueDate !== 'string')
  ) {
    throw new Error('Task row has an unexpected shape.')
  }

  return {
    id,
    title,
    status,
    user_id: userId,
    created_at: createdAt,
    description,
    priority,
    due_date: dueDate,
  }
}

// Returns every task owned by userId, oldest first. RLS enforces ownership;
// the user_id filter is defense in depth and keeps the query explicit.
export async function listTasks(client: SupabaseClient, userId: string): Promise<Task[]> {
  const { data, error } = await client
    .from('tasks')
    .select(TASK_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (error) throw error
  return data.map(parseTask)
}
