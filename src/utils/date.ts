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
