interface StatusScreenProps {
  tone: 'loading' | 'error'
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

// Full-page message for states where the board cannot be shown yet.
function StatusScreen({ tone, title, message, actionLabel, onAction }: StatusScreenProps) {
  return (
    <div className="status-screen">
      <div
        className={`status-screen__panel status-screen__panel--${tone}`}
        role={tone === 'error' ? 'alert' : 'status'}
      >
        {tone === 'loading' && <span className="spinner" aria-hidden="true" />}
        <h2 className="status-screen__title">{title}</h2>
        <p className="status-screen__message">{message}</p>
        {actionLabel && onAction && (
          <button type="button" className="button button--primary" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export default StatusScreen
