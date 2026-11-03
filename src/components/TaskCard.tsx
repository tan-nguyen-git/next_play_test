import { COLUMNS, PRIORITY_LABELS } from '../constants'
import type { Task, TaskStatus } from '../types/task'
import { formatDueDate } from '../utils/date'
import { openButtonId, statusSelectId } from '../utils/domIds'
import { isTaskStatus } from '../utils/taskValidation'

interface TaskCardProps {
  task: Task
  pending: boolean
  onOpen: (taskId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
}

function TaskCard({ task, pending, onOpen, onStatusChange }: TaskCardProps) {
  const dueLabel = task.due_date ? formatDueDate(task.due_date) : null
  const selectId = statusSelectId(task.id)

  return (
    <article className={`task-card${pending ? ' task-card--pending' : ''}`} aria-busy={pending || undefined}>
      <h3 className="task-card__title">
        {/* The button's ::after stretches over the card, so clicking anywhere opens it. */}
        <button id={openButtonId(task.id)} type="button" className="task-card__open" onClick={() => onOpen(task.id)}>
          {task.title}
        </button>
      </h3>
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
        <label htmlFor={selectId} className="visually-hidden">
          Status for {task.title}
        </label>
        <select
          id={selectId}
          className="status-select"
          value={task.status}
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
