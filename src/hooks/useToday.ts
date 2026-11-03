import { useEffect, useState } from 'react'
import { addDays } from '../utils/date'

// The current local date, refreshed at the next local midnight so "due today"
// and "overdue" stay correct if the board is left open overnight.
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    const nextMidnight = addDays(today, 1)
    // +1s margin so the timer fires just after midnight, not just before.
    const delay = Math.max(nextMidnight.getTime() - Date.now() + 1000, 1000)
    const timer = window.setTimeout(() => setToday(new Date()), delay)
    return () => window.clearTimeout(timer)
  }, [today])

  return today
}
