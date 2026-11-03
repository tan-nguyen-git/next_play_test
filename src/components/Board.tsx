import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { COLUMNS } from '../constants'
import type { Task, TaskStatus } from '../types/task'
import { parseColumnDropId, parseTaskDragId } from '../utils/dragIds'
import BoardColumn from './BoardColumn'
import TaskCard from './TaskCard'

interface BoardProps {
  // The visible (possibly filtered) tasks.
  tasks: Task[]
  filtering: boolean
  today: Date
  pendingIds: ReadonlySet<string>
  onAddTask: (status: TaskStatus) => void
  onOpenTask: (taskId: string) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onDropTask: (task: Task, status: TaskStatus) => void
}

// Releasing a drag over the card it started on would count as a click and open
// the task. Swallow that single click; normal clicks are unaffected.
function suppressNextClick() {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
  }
  window.addEventListener('click', swallow, { capture: true, once: true })
  window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0)
}

function columnLabel(status: TaskStatus | null) {
  return COLUMNS.find((column) => column.status === status)?.label ?? 'no column'
}

function Board({ tasks, filtering, today, pendingIds, onAddTask, onOpenTask, onStatusChange, onDropTask }: BoardProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const activeTask = activeTaskId ? tasks.find((task) => task.id === activeTaskId) : undefined

  // Mouse: a drag starts after moving 4px, so a plain click still opens the card.
  // Touch: press and hold briefly first, so a quick swipe still scrolls the board.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  )

  const findTask = (dragId: string | number) => {
    const taskId = parseTaskDragId(dragId)
    return taskId ? tasks.find((task) => task.id === taskId) : undefined
  }

  // Screen reader messages using task titles instead of internal IDs.
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${findTask(active.id)?.title ?? 'task'}.`,
    onDragOver: ({ active, over }) =>
      `${findTask(active.id)?.title ?? 'Task'} is over ${columnLabel(over ? parseColumnDropId(over.id) : null)}.`,
    onDragEnd: ({ active, over }) =>
      `Dropped ${findTask(active.id)?.title ?? 'task'} in ${columnLabel(over ? parseColumnDropId(over.id) : null)}.`,
    onDragCancel: ({ active }) => `Moving ${findTask(active.id)?.title ?? 'task'} was cancelled.`,
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveTaskId(parseTaskDragId(active.id))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveTaskId(null)
    suppressNextClick()
    // Only columns are drop targets, so `over` is always a column (or null
    // when dropped outside). Validate both sides against current data.
    const task = findTask(active.id)
    const status = over ? parseColumnDropId(over.id) : null
    if (!task || !status || task.status === status || pendingIds.has(task.id)) return
    onDropTask(task, status)
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveTaskId(null)
        suppressNextClick()
      }}
    >
      <div className="board">
        {COLUMNS.map((column) => (
          <BoardColumn
            key={column.status}
            column={column}
            // Derived from the one task list on every render; never stored separately.
            tasks={tasks.filter((task) => task.status === column.status)}
            filtering={filtering}
            today={today}
            pendingIds={pendingIds}
            onAddTask={onAddTask}
            onOpenTask={onOpenTask}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
      {/* A floating copy follows the pointer, so it is never clipped by the scrolling board. */}
      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} today={today} pending={false} overlay onOpen={() => {}} onStatusChange={() => {}} />
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default Board
