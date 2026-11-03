import { COLUMNS } from '../constants'

// Placeholder board shown while tasks load, so the layout doesn't jump.
const PLACEHOLDER_CARDS = [2, 1, 1, 1]

function BoardSkeleton() {
  return (
    <div className="board board--skeleton" role="status">
      <span className="visually-hidden">Loading your board…</span>
      {COLUMNS.map((column, index) => (
        <div key={column.status} className="board-column" aria-hidden="true">
          <div className="board-column__header">
            <span className="skeleton skeleton--dot" />
            <span className="skeleton skeleton--label" />
          </div>
          {Array.from({ length: PLACEHOLDER_CARDS[index] }, (_, card) => (
            <div key={card} className="skeleton-card">
              <span className="skeleton skeleton--title" />
              <span className="skeleton skeleton--line" />
              <span className="skeleton skeleton--chip" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default BoardSkeleton
