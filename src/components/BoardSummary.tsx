import type { BoardSummaryCounts } from '../utils/taskStats'

interface BoardSummaryProps {
  counts: BoardSummaryCounts
}

function BoardSummary({ counts }: BoardSummaryProps) {
  return (
    <section className="board-summary" aria-labelledby="board-summary-heading">
      <h2 id="board-summary-heading" className="board-summary__label">
        Whole board
      </h2>
      <dl className="board-summary__stats">
        <div className="stat">
          <dt>Total</dt>
          <dd>{counts.total}</dd>
        </div>
        <div className="stat stat--done">
          <dt>Completed</dt>
          <dd>{counts.completed}</dd>
        </div>
        <div className={`stat${counts.overdue > 0 ? ' stat--overdue' : ''}`}>
          <dt>Overdue</dt>
          <dd>{counts.overdue}</dd>
        </div>
      </dl>
    </section>
  )
}

export default BoardSummary
