import { useDroppable } from '@dnd-kit/core'
import type { CSSProperties } from 'react'
import type { ColumnConfig } from '../constants'
import type { Task, TaskStatus } from '../types/task'
import { columnDropId } from '../utils/dragIds'
import { InboxIcon, PlusIcon } from './Icons'
import { DraggableTaskCard } from './TaskCard'

interface BoardColumnProps {
  column: ColumnConfig
  tasks: Task[]
  filtering: boolean
  today: Date
  pendingIds: ReadonlySet<string>
  onAddTask: (status: TaskStatus) => void
  onOpenTask: (taskId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
}

function BoardColumn({ column, tasks, filtering, today, pendingIds, onAddTask, onOpenTask, onStatusChange }: BoardColumnProps) {
  const headingId = `column-${column.status}-heading`
  // The whole column (header, cards, and empty area) is one drop target.
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(column.status) })
  // Exposes the column's accent color to CSS as a custom property.
  const accentStyle: CSSProperties & Record<'--column-accent', string> = {
    '--column-accent': column.accent,
  }

  return (
    <section
      ref={setNodeRef}
      className={`board-column${isOver ? ' board-column--over' : ''}`}
      aria-labelledby={headingId}
      style={accentStyle}
    >
      <header className="board-column__header">
        <div className="column-pill">
          <span className="column-pill__dot" aria-hidden="true" />
          <h2 id={headingId} className="board-column__title">
            {column.label}
          </h2>
        </div>
        <span className="board-column__count">
          {tasks.length}
          <span className="visually-hidden"> {tasks.length === 1 ? 'task' : 'tasks'}</span>
        </span>
        <button
          type="button"
          className="icon-button icon-button--small"
          aria-label={`Add task to ${column.label}`}
          onClick={() => onAddTask(column.status)}
        >
          <span aria-hidden="true">+</span>
        </button>
      </header>

      {tasks.length === 0 ? (
        <div className="board-column__empty">
          <InboxIcon size={20} />
          <p>{filtering ? 'No matching tasks' : 'No tasks here yet'}</p>
        </div>
      ) : (
        <ul className="board-column__list">
          {tasks.map((task) => (
            <li key={task.id}>
              <DraggableTaskCard
                task={task}
                today={today}
                pending={pendingIds.has(task.id)}
                onOpen={onOpenTask}
                onStatusChange={onStatusChange}
              />
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="column-add" onClick={() => onAddTask(column.status)}>
        <PlusIcon size={14} /> New task
        <span className="visually-hidden"> in {column.label}</span>
      </button>
    </section>
  )
}

export default BoardColumn
