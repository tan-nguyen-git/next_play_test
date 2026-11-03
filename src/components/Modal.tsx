import { useEffect, useId, useRef, type ReactNode, type SyntheticEvent } from 'react'

interface ModalProps {
  title: string
  // Omit to block closing (for example while a save is in progress).
  onRequestClose?: () => void
  children: ReactNode
}

// Accessible modal built on the native <dialog> element. The parent decides
// whether it is open by rendering or not rendering it.
function Modal({ title, onRequestClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  // Keep the latest callback without re-running the open/close effect.
  const requestCloseRef = useRef(onRequestClose)

  useEffect(() => {
    requestCloseRef.current = onRequestClose
  }, [onRequestClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    // Remember what had focus (the button that opened us) to restore it later.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null

    dialog.showModal()
    // Move focus to the element marked data-autofocus, if any.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()

    return () => {
      dialog.close()
      opener?.focus()
    }
  }, [])

  // Escape fires "cancel". React state decides whether we close, not the browser.
  function handleCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault()
    requestCloseRef.current?.()
  }

  // Some browsers can still close the dialog natively; keep React in charge.
  function handleClose() {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    if (requestCloseRef.current) requestCloseRef.current()
    else dialog.showModal()
  }

  return (
    <dialog ref={dialogRef} className="modal" aria-labelledby={titleId} onCancel={handleCancel} onClose={handleClose}>
      <header className="modal__header">
        <h2 id={titleId} className="modal__title">
          {title}
        </h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close"
          onClick={() => onRequestClose?.()}
          disabled={!onRequestClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      {children}
    </dialog>
  )
}

export default Modal
