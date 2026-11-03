import { useDraggable, type DraggableSyntheticListeners } from '@dnd-kit/core'
import { COLUMNS, PRIORITY_LABELS } from '../constants'
import type { Task, TaskStatus } from '../types/task'
import { formatDueDate } from '../utils/date'
import { openButtonId, statusSelectId } from '../utils/domIds'
import { taskDragId } from '../utils/dragIds'
import { isTaskStatus } from '../utils/taskValidation'

interface DragBindings {
  setNodeRef: (element: HTMLElement | null) => void
  setActivatorNodeRef: (element: HTMLElement | null) => void
  listeners: DraggableSyntheticListeners
  isDragging: boolean
}

interface TaskCardProps {
  task: Task
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
  const { setNodeRef, setActivatorNodeRef, listeners, isDragging } = useDraggable({
    id: taskDragId(props.task.id),
    // No drags while this task is saving.
    disabled: props.pending,
  })
  return <TaskCard {...props} drag={{ setNodeRef, setActivatorNodeRef, listeners, isDragging }} />
}

function TaskCard({ task, pending, overlay = false, drag, onOpen, onStatusChange }: TaskCardProps) {
  const dueLabel = task.due_date ? formatDueDate(task.due_date) : null
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
        {/* Pointer-only drag handle. Keyboard and screen reader users move cards
            with the status selector below, so the handle is hidden from them. */}
        <span
          ref={drag?.setActivatorNodeRef}
          className="drag-handle"
          aria-hidden="true"
          title={pending ? 'Saving…' : 'Drag to another column'}
          {...drag?.listeners}
        >
          <svg width="12" height="16" viewBox="0 0 12 16" focusable="false">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="9" cy="3" r="1.5" />
            <circle cx="3" cy="8" r="1.5" />
            <circle cx="9" cy="8" r="1.5" />
            <circle cx="3" cy="13" r="1.5" />
            <circle cx="9" cy="13" r="1.5" />
          </svg>
        </span>
      </div>
      {task.description && <p className="task-card__description">{task.description}</p>}
      <div className="task-card__meta">
        <span className={`priority-badge priority-badge--${task.priority}`}>
          {PRIORITY_LABELS[task.priority]}
          <span className="visually-hidden"> priority</span>
        </span>
        {task.due_date && dueLabel && (
          <span className="task-card__due">
            Due <time dateTime={task.due_date}>{dueLabel}</time>
          </span>
        )}
        {pending && (
          <span className="task-card__saving" role="status">
            Saving…
          </span>
        )}
      </div>
      <div className="task-card__status">
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
      </div>
    </article>
  )
}

export default TaskCard
