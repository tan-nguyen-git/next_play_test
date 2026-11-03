import { COLUMNS } from '../constants'
import type { Task, TaskStatus } from '../types/task'
import BoardColumn from './BoardColumn'

interface BoardProps {
  tasks: Task[]
  onAddTask: (status: TaskStatus) => void
}

function Board({ tasks, onAddTask }: BoardProps) {
  return (
    <div className="board">
      {COLUMNS.map((column) => (
        <BoardColumn
          key={column.status}
          column={column}
          // Derived from the one task list on every render; never stored separately.
          tasks={tasks.filter((task) => task.status === column.status)}
          onAddTask={onAddTask}
        />
      ))}
    </div>
  )
}

export default Board
