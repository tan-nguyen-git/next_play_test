import { useId, useRef, useState, type FormEvent } from 'react'
import { COLUMNS, PRIORITY_LABELS, TASK_PRIORITIES } from '../constants'
import { describeTaskError } from '../services/tasks'
import type { Task, TaskInput, TaskStatus } from '../types/task'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  isTaskPriority,
  isTaskStatus,
  validateTaskForm,
  type TaskFormErrors,
  type TaskFormValues,
} from '../utils/taskValidation'
import Modal from './Modal'

interface TaskFormProps {
  // Edit mode when a task is given; create mode otherwise.
  task?: Task
  initialStatus?: TaskStatus
  // Resolves when the task is saved; rejects to keep the form open with an error.
  onSubmit: (input: TaskInput) => Promise<void>
  onCancel: () => void
}

function TaskForm({ task, initialStatus = 'todo', onSubmit, onCancel }: TaskFormProps) {
  // Controlled inputs: React state is the single source of each field's value.
  // The initializer runs only on mount, so the parent gives each task its own
  // `key` to get a fresh form when switching tasks.
  const [values, setValues] = useState<TaskFormValues>(() =>
    task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.due_date ?? '',
        }
      : { title: '', description: '', status: initialStatus, priority: 'normal', dueDate: '' },
  )
  const [errors, setErrors] = useState<TaskFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // A ref updates immediately, so two very fast clicks cannot both submit.
  const savingRef = useRef(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const fieldId = useId()

  function updateField<K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    // Clear that field's error as soon as the user changes it.
    if (key in errors) setErrors((current) => ({ ...current, [key]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Stop the browser's default full-page form submission.
    event.preventDefault()
    if (savingRef.current) return

    const result = validateTaskForm(values)
    if (!result.ok) {
      setErrors(result.errors)
      if (result.errors.title) titleRef.current?.focus()
      else if (result.errors.description) descriptionRef.current?.focus()
      return
    }

    savingRef.current = true
    setSaving(true)
    setSubmitError(null)
    try {
      await onSubmit(result.input)
      // On success the parent closes the modal, which unmounts and resets this form.
    } catch (error) {
      if (import.meta.env.DEV) console.error('Saving task failed:', error)
      setSubmitError(
        describeTaskError(error, 'We could not save this task. Your changes are still here, so you can try again.'),
      )
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const titleLength = values.title.trim().length
  const ids = {
    title: `${fieldId}-title`,
    titleHint: `${fieldId}-title-hint`,
    titleError: `${fieldId}-title-error`,
    description: `${fieldId}-description`,
    descriptionHint: `${fieldId}-description-hint`,
    descriptionError: `${fieldId}-description-error`,
    status: `${fieldId}-status`,
    priority: `${fieldId}-priority`,
    dueDate: `${fieldId}-due`,
    dueDateError: `${fieldId}-due-error`,
  }

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onRequestClose={saving ? undefined : onCancel}>
      <form className="task-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={ids.title} className="field__label">
            Title <span className="field__required">(required)</span>
          </label>
          <input
            ref={titleRef}
            id={ids.title}
            className="input"
            type="text"
            value={values.title}
            onChange={(event) => updateField('title', event.target.value)}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? `${ids.titleError} ${ids.titleHint}` : ids.titleHint}
            autoComplete="off"
            data-autofocus
          />
          <div className="field__footer">
            {errors.title && (
              <p id={ids.titleError} className="field__error">
                {errors.title}
              </p>
            )}
            <p
              id={ids.titleHint}
              className={`field__count${titleLength > TITLE_MAX_LENGTH ? ' field__count--over' : ''}`}
            >
              {titleLength}/{TITLE_MAX_LENGTH}
            </p>
          </div>
        </div>

        <div className="field">
          <label htmlFor={ids.description} className="field__label">
            Description
          </label>
          <textarea
            ref={descriptionRef}
            id={ids.description}
            className="input input--textarea"
            rows={4}
            value={values.description}
            onChange={(event) => updateField('description', event.target.value)}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={
              errors.description ? `${ids.descriptionError} ${ids.descriptionHint}` : ids.descriptionHint
            }
          />
          <div className="field__footer">
            {errors.description && (
              <p id={ids.descriptionError} className="field__error">
                {errors.description}
              </p>
            )}
            <p
              id={ids.descriptionHint}
              className={`field__count${values.description.length > DESCRIPTION_MAX_LENGTH ? ' field__count--over' : ''}`}
            >
              {values.description.length}/{DESCRIPTION_MAX_LENGTH}
            </p>
          </div>
        </div>

        <div className="task-form__row">
          <div className="field">
            <label htmlFor={ids.status} className="field__label">
              Status
            </label>
            <select
              id={ids.status}
              className="input"
              value={values.status}
              onChange={(event) => {
                if (isTaskStatus(event.target.value)) updateField('status', event.target.value)
              }}
            >
              {COLUMNS.map((column) => (
                <option key={column.status} value={column.status}>
                  {column.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor={ids.priority} className="field__label">
              Priority
            </label>
            <select
              id={ids.priority}
              className="input"
              value={values.priority}
              onChange={(event) => {
                if (isTaskPriority(event.target.value)) updateField('priority', event.target.value)
              }}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor={ids.dueDate} className="field__label">
              Due date
            </label>
            <input
              id={ids.dueDate}
              className="input"
              type="date"
              value={values.dueDate}
              onChange={(event) => updateField('dueDate', event.target.value)}
              aria-invalid={errors.dueDate ? true : undefined}
              aria-describedby={errors.dueDate ? ids.dueDateError : undefined}
            />
            {errors.dueDate && (
              <p id={ids.dueDateError} className="field__error">
                {errors.dueDate}
              </p>
            )}
          </div>
        </div>

        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}

        <div className="task-form__actions">
          <button type="button" className="button button--secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="button button--primary" aria-disabled={saving}>
            {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TaskForm
