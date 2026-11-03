import { COLUMNS } from '../constants'
import type { Task, TaskStatus } from '../types/task'
import BoardColumn from './BoardColumn'

interface BoardProps {
  tasks: Task[]
  pendingIds: ReadonlySet<string>
  onAddTask: (status: TaskStatus) => void
  onOpenTask: (taskId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
}

function Board({ tasks, pendingIds, onAddTask, onOpenTask, onStatusChange }: BoardProps) {
  return (
    <div className="board">
      {COLUMNS.map((column) => (
        <BoardColumn
          key={column.status}
          column={column}
          // Derived from the one task list on every render; never stored separately.
          tasks={tasks.filter((task) => task.status === column.status)}
          pendingIds={pendingIds}
          onAddTask={onAddTask}
          onOpenTask={onOpenTask}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  )
}

export default Board
