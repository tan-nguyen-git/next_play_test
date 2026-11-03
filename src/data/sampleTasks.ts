import type { Task } from '../types/task'

// TEMPORARY: local preview data for Task 2 only.
// Removed from the real flow once tasks load from Supabase (Task 4/5).
// "In Review" is intentionally empty to show the empty-column state.
export const SAMPLE_TASKS: Task[] = [
  {
    id: 'sample-1',
    title: 'Sketch the board layout',
    status: 'done',
    user_id: 'sample-user',
    created_at: '2026-11-01T09:00:00Z',
    description: 'Decide on column widths, card spacing, and the header.',
    priority: 'normal',
    due_date: '2026-11-01',
  },
  {
    id: 'sample-2',
    title: 'Write the database schema',
    status: 'in_progress',
    user_id: 'sample-user',
    created_at: '2026-11-01T10:00:00Z',
    description: 'Tasks table, constraints, index, and row level security policies.',
    priority: 'high',
    due_date: '2026-11-04',
  },
  {
    id: 'sample-3',
    title: 'Set up guest sessions',
    status: 'todo',
    user_id: 'sample-user',
    created_at: '2026-11-01T11:00:00Z',
    description: '',
    priority: 'high',
    due_date: null,
  },
  {
    id: 'sample-4',
    title: 'Add drag and drop between columns',
    status: 'todo',
    user_id: 'sample-user',
    created_at: '2026-11-01T12:00:00Z',
    description:
      'Every column should accept drops, including empty ones. Save the new status after a successful drop and roll back if the request fails.',
    priority: 'normal',
    due_date: '2026-11-10',
  },
  {
    id: 'sample-5',
    title: 'Polish empty and loading states',
    status: 'todo',
    user_id: 'sample-user',
    created_at: '2026-11-01T13:00:00Z',
    description: 'Nice to have once the core flow works.',
    priority: 'low',
    due_date: null,
  },
]
