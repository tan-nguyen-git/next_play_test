import { PRIORITY_LABELS } from '../constants'
import type { Task } from '../types/task'
import { formatDueDate } from '../utils/date'

interface TaskCardProps {
  task: Task
}

function TaskCard({ task }: TaskCardProps) {
  const dueLabel = task.due_date ? formatDueDate(task.due_date) : null

  return (
    <article className="task-card">
      <h3 className="task-card__title">{task.title}</h3>
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
      </div>
    </article>
  )
}

export default TaskCard
