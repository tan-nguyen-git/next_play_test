import { useEffect, useId, useRef, useState } from 'react'
import { describeTaskError } from '../services/tasks'

interface DeleteConfirmationProps {
  taskTitle: string
  onConfirm: () => Promise<void>
  onCancel: () => void
  onBusyChange: (busy: boolean) => void
}

// Second, deliberate step before deleting. Shown inside the edit dialog so
// unsaved edits survive if the user changes their mind.
function DeleteConfirmation({ taskTitle, onConfirm, onCancel, onBusyChange }: DeleteConfirmationProps) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A ref updates immediately, so a double click cannot send two deletes.
  const deletingRef = useRef(false)
  const keepButtonRef = useRef<HTMLButtonElement>(null)
  const headingId = useId()

  // Start on the safe choice.
  useEffect(() => {
    keepButtonRef.current?.focus()
  }, [])

  async function handleConfirm() {
    if (deletingRef.current) return
    deletingRef.current = true
    setDeleting(true)
    onBusyChange(true)
    setError(null)
    try {
      await onConfirm()
      // On success the parent closes the dialog.
    } catch (err) {
      if (import.meta.env.DEV) console.error('Deleting task failed:', err)
      setError(describeTaskError(err, 'We could not delete this task. It is still on your board, so you can try again.'))
      deletingRef.current = false
      setDeleting(false)
      onBusyChange(false)
    }
  }

  return (
    <div className="delete-confirm" role="group" aria-labelledby={headingId}>
      <p id={headingId} className="delete-confirm__message">
        Delete <strong>“{taskTitle}”</strong>? This can’t be undone.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="task-form__actions">
        <button
          ref={keepButtonRef}
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={deleting}
        >
          Keep task
        </button>
        <button
          type="button"
          className="button button--danger"
          onClick={handleConfirm}
          aria-disabled={deleting}
        >
          {deleting ? 'Deleting…' : 'Delete task'}
        </button>
      </div>
    </div>
  )
}

export default DeleteConfirmation
