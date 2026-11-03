import type { SupabaseClient } from '@supabase/supabase-js'
import type { Task, TaskInput } from '../types/task'
import { isTaskPriority, isTaskStatus } from '../utils/taskValidation'

// Request exactly the columns the Task type describes.
const TASK_COLUMNS = 'id, title, status, user_id, created_at, description, priority, due_date'

// The request succeeded but matched no row: it was deleted, or RLS hid it.
export class TaskNotFoundError extends Error {
  constructor() {
    super('No matching task was found.')
    this.name = 'TaskNotFoundError'
  }
}

// Another save for the same task is still in flight.
export class TaskBusyError extends Error {
  constructor() {
    super('This task is already being saved.')
    this.name = 'TaskBusyError'
  }
}

// A user-facing message for a failed task mutation. Raw database errors stay in dev logs.
export function describeTaskError(error: unknown, fallback: string): string {
  if (error instanceof TaskNotFoundError) {
    return 'This task no longer exists on your board. Refresh the page to see your latest tasks.'
  }
  if (error instanceof TaskBusyError) {
    return 'This task is still saving another change. Wait a moment and try again.'
  }
  return fallback
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

// Inserts a task owned by userId and returns the stored row, including the
// database-generated id and created_at. Fields are listed explicitly so no
// UI-only or ownership-changing properties can slip into the request.
export async function createTask(client: SupabaseClient, userId: string, input: TaskInput): Promise<Task> {
  const { data, error } = await client
    .from('tasks')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      due_date: input.due_date,
    })
    .select(TASK_COLUMNS)
    .single()

  if (error) throw error
  return parseTask(data)
}

// Only these fields can ever be changed; id, user_id, and created_at cannot.
export type TaskChanges = Partial<TaskInput>

// Updates one task and returns the stored row. Zero matched rows is a failure,
// not a silent success.
export async function updateTask(
  client: SupabaseClient,
  userId: string,
  taskId: string,
  changes: TaskChanges,
): Promise<Task> {
  const payload: TaskChanges = {}
  if (changes.title !== undefined) payload.title = changes.title
  if (changes.description !== undefined) payload.description = changes.description
  if (changes.status !== undefined) payload.status = changes.status
  if (changes.priority !== undefined) payload.priority = changes.priority
  if (changes.due_date !== undefined) payload.due_date = changes.due_date

  const { data, error } = await client
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select(TASK_COLUMNS)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new TaskNotFoundError()
  return parseTask(data)
}

// Deletes one task. Asking for the deleted row back is how we confirm that a
// row was actually removed; zero rows means nothing matched.
export async function deleteTask(client: SupabaseClient, userId: string, taskId: string): Promise<void> {
  const { data, error } = await client
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('id')

  if (error) throw error
  if (data.length === 0) throw new TaskNotFoundError()
}
