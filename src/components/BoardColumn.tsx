import type { CSSProperties } from 'react'
import type { ColumnConfig } from '../constants'
import type { Task } from '../types/task'
import TaskCard from './TaskCard'

interface BoardColumnProps {
  column: ColumnConfig
  tasks: Task[]
}

function BoardColumn({ column, tasks }: BoardColumnProps) {
  const headingId = `column-${column.status}-heading`
  // Exposes the column's accent color to CSS as a custom property.
  const accentStyle: CSSProperties & Record<'--column-accent', string> = {
    '--column-accent': column.accent,
  }

  return (
    <section className="board-column" aria-labelledby={headingId} style={accentStyle}>
      <header className="board-column__header">
        <span className="board-column__dot" aria-hidden="true" />
        <h2 id={headingId} className="board-column__title">
          {column.label}
        </h2>
        <span className="board-column__count">
          {tasks.length}
          <span className="visually-hidden"> {tasks.length === 1 ? 'task' : 'tasks'}</span>
        </span>
      </header>

      {tasks.length === 0 ? (
        <div className="board-column__empty">
          <p>No tasks here yet</p>
        </div>
      ) : (
        <ul className="board-column__list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default BoardColumn
