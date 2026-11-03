import type { BoardSummaryCounts } from '../utils/taskStats'

interface BoardSummaryProps {
  counts: BoardSummaryCounts
}

function BoardSummary({ counts }: BoardSummaryProps) {
  const percent = counts.total === 0 ? 0 : Math.round((counts.completed / counts.total) * 100)

  return (
    <section className="board-summary" aria-labelledby="board-summary-heading">
      <p id="board-summary-heading" className="board-summary__label">
        Whole board
      </p>
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
      <div className="board-summary__progress" title={`${percent}% of tasks completed`}>
        <span className="progress" aria-hidden="true">
          <span className="progress__fill" style={{ width: `${percent}%` }} />
        </span>
        <span className="board-summary__percent">{percent}% done</span>
      </div>
    </section>
  )
}

export default BoardSummary
