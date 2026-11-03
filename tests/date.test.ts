// Run with `npm test` (Node's built-in test runner; Node strips the types).
// A fixed timezone with daylight saving makes the DST cases meaningful.
process.env.TZ = 'America/New_York'

import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { addDays, getDueState, parseDateOnly, toDateKey } from '../src/utils/date.ts'

// Local date-time helper: month is 1-based for readability.
const at = (y: number, m: number, d: number, h = 12, min = 0, s = 0) => new Date(y, m - 1, d, h, min, s)

describe('parseDateOnly', () => {
  test('parses as a local calendar date, not UTC', () => {
    const date = parseDateOnly('2026-11-04')
    assert.ok(date)
    // new Date('2026-11-04') would be Nov 3 in New York (UTC midnight = 8pm local).
    assert.equal(toDateKey(date), 20261104)
  })

  test('rejects impossible or malformed dates', () => {
    assert.equal(parseDateOnly('2026-02-31'), null)
    assert.equal(parseDateOnly('2026-13-01'), null)
    assert.equal(parseDateOnly('not-a-date'), null)
    assert.equal(parseDateOnly('2026-1-5'), null)
  })
})

describe('getDueState', () => {
  const today = at(2026, 11, 15)

  test('yesterday is overdue', () => {
    assert.equal(getDueState('2026-11-14', false, today), 'overdue')
  })

  test('today and tomorrow are due soon', () => {
    assert.equal(getDueState('2026-11-15', false, today), 'due_today')
    assert.equal(getDueState('2026-11-16', false, today), 'due_tomorrow')
  })

  test('the day after tomorrow is upcoming', () => {
    assert.equal(getDueState('2026-11-17', false, today), 'upcoming')
  })

  test('completed tasks are never urgent', () => {
    assert.equal(getDueState('2026-11-01', true, today), 'none')
    assert.equal(getDueState('2026-11-15', true, today), 'none')
  })

  test('no date or an invalid date is not urgent and does not throw', () => {
    assert.equal(getDueState(null, false, today), 'none')
    assert.equal(getDueState('', false, today), 'none')
    assert.equal(getDueState('2026-02-31', false, today), 'none')
  })

  test('near midnight: the calendar day decides, not the time', () => {
    const lateNight = at(2026, 11, 15, 23, 59, 59)
    assert.equal(getDueState('2026-11-15', false, lateNight), 'due_today')
    assert.equal(getDueState('2026-11-16', false, lateNight), 'due_tomorrow')
    const justAfter = at(2026, 11, 16, 0, 0, 1)
    assert.equal(getDueState('2026-11-15', false, justAfter), 'overdue')
    assert.equal(getDueState('2026-11-16', false, justAfter), 'due_today')
  })

  test('month and year boundaries', () => {
    assert.equal(getDueState('2026-02-01', false, at(2026, 1, 31)), 'due_tomorrow')
    assert.equal(getDueState('2027-01-01', false, at(2026, 12, 31)), 'due_tomorrow')
    assert.equal(getDueState('2026-12-31', false, at(2027, 1, 1)), 'overdue')
    // 2028 is a leap year.
    assert.equal(getDueState('2028-02-29', false, at(2028, 2, 28)), 'due_tomorrow')
  })

  test('daylight-saving changes do not shift days', () => {
    // US clocks spring forward on 2026-03-08 (a 23-hour day) and fall back on 2026-11-01 (25 hours).
    assert.equal(getDueState('2026-03-08', false, at(2026, 3, 7, 23, 30)), 'due_tomorrow')
    assert.equal(getDueState('2026-03-09', false, at(2026, 3, 8, 0, 30)), 'due_tomorrow')
    assert.equal(getDueState('2026-11-02', false, at(2026, 11, 1, 23, 30)), 'due_tomorrow')
    assert.equal(getDueState('2026-10-31', false, at(2026, 11, 1, 0, 30)), 'overdue')
  })
})

describe('addDays', () => {
  test('rolls over months and years by calendar day', () => {
    assert.equal(toDateKey(addDays(at(2026, 1, 31), 1)), 20260201)
    assert.equal(toDateKey(addDays(at(2026, 12, 31), 1)), 20270101)
    assert.equal(toDateKey(addDays(at(2026, 3, 8, 0, 30), 1)), 20260309)
  })
})
