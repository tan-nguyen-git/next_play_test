import { useDraggable, type DraggableSyntheticListeners } from '@dnd-kit/core'
import type { SyntheticEvent } from 'react'
import { COLUMNS, PRIORITY_LABELS } from '../constants'
import type { Task, TaskStatus } from '../types/task'
import { formatDueDate, getDueState, type DueState } from '../utils/date'
import { openButtonId, statusSelectId } from '../utils/domIds'
import { taskDragId } from '../utils/dragIds'
import { isTaskStatus } from '../utils/taskValidation'
import { AlertIcon, CalendarIcon, ClockIcon, PriorityIcon, StatusIcon } from './Icons'

interface DragBindings {
  setNodeRef: (element: HTMLElement | null) => void
  listeners: DraggableSyntheticListeners
  isDragging: boolean
}

// The whole card starts a drag, except its own form controls (the status
// selector), which must keep working normally.
function withoutControls(listeners: DraggableSyntheticListeners): DraggableSyntheticListeners {
  if (!listeners) return listeners
  const guarded: Record<string, (event: SyntheticEvent) => void> = {}
  for (const [name, handler] of Object.entries(listeners)) {
    guarded[name] = (event) => {
      if (event.target instanceof Element && event.target.closest('select')) return
      handler(event)
    }
  }
  return guarded
}

// Text labels, so urgency never depends on color alone.
const DUE_BADGES: Partial<Record<DueState, { label: string; tone: 'overdue' | 'soon' }>> = {
  overdue: { label: 'Overdue', tone: 'overdue' },
  due_today: { label: 'Due today', tone: 'soon' },
  due_tomorrow: { label: 'Due tomorrow', tone: 'soon' },
}

interface TaskCardProps {
  task: Task
  today: Date
  pending: boolean
  // The floating copy shown while dragging: purely visual, not interactive.
  overlay?: boolean
  drag?: DragBindings
  onOpen: (taskId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
}

type DraggableTaskCardProps = Omit<TaskCardProps, 'drag' | 'overlay'>

// Registers the card with dnd-kit. Kept separate so the drag overlay can render
// a plain TaskCard without registering a second draggable with the same ID.
export function DraggableTaskCard(props: DraggableTaskCardProps) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: taskDragId(props.task.id),
    // No drags while this task is saving.
    disabled: props.pending,
  })
  return <TaskCard {...props} drag={{ setNodeRef, listeners: withoutControls(listeners), isDragging }} />
}

function TaskCard({ task, today, pending, overlay = false, drag, onOpen, onStatusChange }: TaskCardProps) {
  const dueLabel = task.due_date ? formatDueDate(task.due_date) : null
  const dueBadge = DUE_BADGES[getDueState(task.due_date, task.status === 'done', today)]
  const selectId = statusSelectId(task.id)

  const className = [
    'task-card',
    pending && 'task-card--pending',
    drag?.isDragging && 'task-card--placeholder',
    overlay && 'task-card--overlay',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article
      ref={drag?.setNodeRef}
      className={className}
      aria-busy={pending || undefined}
      aria-hidden={overlay || undefined}
      {...drag?.listeners}
    >
      <div className="task-card__header">
        <h3 className="task-card__title">
          {/* The button's ::after stretches over the card, so clicking anywhere opens it. */}
          <button
            id={overlay ? undefined : openButtonId(task.id)}
            type="button"
            className="task-card__open"
            onClick={() => onOpen(task.id)}
            tabIndex={overlay ? -1 : undefined}
          >
            {task.title}
          </button>
        </h3>
      </div>
      {task.description && <p className="task-card__description">{task.description}</p>}
      <div className="task-card__meta">
        <span className={`priority-badge priority-badge--${task.priority}`}>
          <PriorityIcon level={task.priority} size={12} />
          {PRIORITY_LABELS[task.priority]}
          <span className="visually-hidden"> priority</span>
        </span>
        {dueBadge && (
          <span className={`due-badge due-badge--${dueBadge.tone}`}>
            {dueBadge.tone === 'overdue' ? <AlertIcon size={12} /> : <ClockIcon size={12} />}
            {dueBadge.label}
          </span>
        )}
        {task.due_date && dueLabel && (
          <span className="task-card__due">
            <CalendarIcon size={12} />
            Due <time dateTime={task.due_date}>{dueLabel}</time>
          </span>
        )}
        {pending && (
          <span className="task-card__saving" role="status">
            Saving…
          </span>
        )}
        <span className="task-card__status" data-status={task.status}>
          <StatusIcon status={task.status} size={12} />
          <label htmlFor={overlay ? undefined : selectId} className="visually-hidden">
            Status for {task.title}
          </label>
          <select
            id={overlay ? undefined : selectId}
            className="status-select"
            value={task.status}
            tabIndex={overlay ? -1 : undefined}
            onChange={(event) => {
              const next = event.target.value
              // Ignored while saving; the controlled value snaps back to task.status.
              if (!pending && isTaskStatus(next) && next !== task.status) onStatusChange(task, next)
            }}
          >
            {COLUMNS.map((column) => (
              <option key={column.status} value={column.status}>
                {column.label}
              </option>
            ))}
          </select>
        </span>
      </div>
    </article>
  )
}

export default TaskCard
