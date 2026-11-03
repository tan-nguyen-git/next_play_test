import { COLUMNS } from '../constants'
import type { Task } from '../types/task'
import BoardColumn from './BoardColumn'

interface BoardProps {
  tasks: Task[]
}

function Board({ tasks }: BoardProps) {
  return (
    <div className="board">
      {COLUMNS.map((column) => (
        <BoardColumn
          key={column.status}
          column={column}
          // Derived from the one task list on every render; never stored separately.
          tasks={tasks.filter((task) => task.status === column.status)}
        />
      ))}
    </div>
  )
}

export default Board
