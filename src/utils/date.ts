// Parses a date-only string like "2026-11-04" as a LOCAL calendar date.
// `new Date("2026-11-04")` would treat it as UTC midnight, which can show
// as the previous day in timezones behind UTC.
export function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, monthIndex, day)

  // Reject impossible dates such as 2026-02-31, which Date would roll over.
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null
  }
  return date
}

// A sortable number for a LOCAL calendar day, e.g. 2026-11-04 -> 20261104.
// Comparing these avoids time-of-day, midnight, and daylight-saving issues:
// two moments on the same calendar day always get the same key.
export function toDateKey(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

// Moves by calendar days, not by 24-hour blocks (some days are 23 or 25 hours).
// The Date constructor handles month and year rollover, e.g. Jan 31 + 1 = Feb 1.
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export type DueState = 'overdue' | 'due_today' | 'due_tomorrow' | 'upcoming' | 'none'

// One shared definition, used by cards and the summary:
// - completed tasks and tasks without a (valid) due date are never urgent;
// - before today is overdue; today or tomorrow is due soon.
export function getDueState(dueDate: string | null, isDone: boolean, today: Date): DueState {
  if (isDone || !dueDate) return 'none'
  const due = parseDateOnly(dueDate)
  if (!due) return 'none'

  const dueKey = toDateKey(due)
  const todayKey = toDateKey(today)
  if (dueKey < todayKey) return 'overdue'
  if (dueKey === todayKey) return 'due_today'
  if (dueKey === toDateKey(addDays(today, 1))) return 'due_tomorrow'
  return 'upcoming'
}

// "Nov 4", or "Nov 4, 2027" when the date is not in the current year.
export function formatDueDate(value: string): string | null {
  const date = parseDateOnly(value)
  if (!date) return null

  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
  })
}
