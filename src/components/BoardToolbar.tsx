import { useId, useRef } from 'react'
import { PRIORITY_LABELS, TASK_PRIORITIES } from '../constants'
import { hasActiveFilters, NO_FILTERS, type TaskFilters } from '../utils/filterTasks'
import { isTaskPriority } from '../utils/taskValidation'
import { SearchIcon } from './Icons'

interface BoardToolbarProps {
  filters: TaskFilters
  onChange: (filters: TaskFilters) => void
}

// Search and filter controls. They only change filter state; the task list
// itself is never modified here.
function BoardToolbar({ filters, onChange }: BoardToolbarProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const active = hasActiveFilters(filters)

  return (
    <div className="board-toolbar" role="search">
      <div className="board-toolbar__field board-toolbar__field--search">
        <label htmlFor={`${id}-search`} className="visually-hidden">
          Search tasks by title
        </label>
        <SearchIcon />
        <input
          ref={searchRef}
          id={`${id}-search`}
          className="input input--with-icon"
          type="search"
          placeholder="Search by title…"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          autoComplete="off"
        />
      </div>
      <div className="board-toolbar__field">
        <label htmlFor={`${id}-priority`} className="visually-hidden">
          Filter by priority
        </label>
        <select
          id={`${id}-priority`}
          className="input"
          value={filters.priority}
          onChange={(event) => {
            const value = event.target.value
            if (value === 'all' || isTaskPriority(value)) onChange({ ...filters, priority: value })
          }}
        >
          <option value="all">All priorities</option>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABELS[priority]} priority
            </option>
          ))}
        </select>
      </div>
      {active && (
        <button
          type="button"
          className="button button--secondary"
          onClick={() => {
            onChange(NO_FILTERS)
            searchRef.current?.focus()
          }}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

export default BoardToolbar
