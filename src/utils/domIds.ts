// Stable element IDs for a task's controls, so focus can be restored after a card moves.
export function statusSelectId(taskId: string) {
  return `task-status-${taskId}`
}

export function openButtonId(taskId: string) {
  return `task-open-${taskId}`
}
