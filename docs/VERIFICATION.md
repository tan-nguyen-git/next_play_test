# Verification report

Results of Task 13: functionality, failure handling, accessibility, and database isolation.
Every **PASS** below was observed in a real run; nothing is marked as passing from code inspection alone.

**Environment:** macOS 15.7, Node.js 26.13, Google Chrome 156 (headless, driven through the Chrome DevTools Protocol with real mouse, touch, and keyboard events), Vite dev server, and the live Supabase project. React 19.3, @supabase/supabase-js 2.118, @dnd-kit/core 6.3.1.

**Legend:** ✅ PASS · ❌ FAIL · ⏳ NOT RUN (reason given)

## Summary

| Area | Result |
| --- | --- |
| Production build, type check, lint | ✅ `npm run build` and `npm run lint` pass (one bundle-size warning, see Known issues) |
| Date logic unit tests | ✅ 11/11 (`npm test`) |
| Database isolation (RLS) | ✅ 24/24 checks (`npm run verify:rls`) |
| Browser feature tests | ✅ 120/120 checks across 10 scenarios, each compared automatically with its expected value |
| Accessibility audit | ✅ Text contrast ≥ 4.5:1 in all four app states (tinted column text measures 5.26–8.58:1); every control has a visible keyboard focus indicator |
| Hosted deployment | ⏳ Task 14 |

## Verification matrix

| Check | Action | Expected | Result |
| --- | --- | --- | --- |
| First guest visit | Open app in a fresh browser profile | Guest initializes once; board usable | ✅ Every browser scenario starts from a fresh profile; one anonymous user is created per profile (also confirmed manually in the Supabase dashboard) |
| Session restoration | Create a task, reload | Same guest and task | ✅ Same guest ID and the task are present after reload |
| Guest separation | Open in a different isolated profile | Different guest; first guest's tasks absent | ✅ Private window gave a different guest with an empty board (manual); see isolation results below |
| Ownership on insert | B inserts with A's `user_id` | Rejected | ✅ Rejected (`42501`) |
| Cross-user read | B requests A's task by ID | No row returned | ✅ 0 rows returned |
| Cross-user update | B updates A's task | Denied or 0 rows; A unchanged | ✅ 0 rows affected; A re-read unchanged |
| Cross-user delete | B deletes A's task | Denied or 0 rows; A unchanged | ✅ 0 rows affected; A still exists |
| Ownership transfer | B sets its own task's `user_id` to A | Rejected | ✅ Rejected (`42501`); owner unchanged |
| Unauthenticated access | Requests with no session | No data, no writes | ✅ Read, insert, update, and delete all rejected (`42501`) |
| Title validation | Submit a whitespace-only title | Clear error; no row | ✅ "Enter a title." shown, field marked `aria-invalid`; the database also rejects it (see constraints) |
| Repeat submission | Click Save three times quickly | Exactly one task | ✅ One card, one row |
| Form failure | Block the tasks API, then save | Input kept; no false success | ✅ Title and description kept, error announced, no card added; retry after unblocking succeeds |
| Edit identity | Open A, close, open B | B's values appear | ✅ Each form shows its own task's values |
| Cross-column drop | Drag through all four columns | Card moves; status persists | ✅ To Do → In Progress → In Review → Done → To Do → Done, one update request each, persisted after reload |
| Empty-column drop | Drop into a column with no cards | Succeeds | ✅ Included in the run above |
| Canceled drop | Same column, outside the board, Escape, short drag back onto the same card | No change, no write, no accidental open | ✅ 0 update requests in all four cases; the dialog does not open after a drag |
| Failed drop save | Block the tasks API, then drop | Prior status restored; error shown | ✅ Card returns; banner names both columns |
| Pending task | Change status again / edit while saving | Prevented or serialized | ✅ Second status change ignored; edit shows "still saving" message. Delete uses the same per-task guard (not separately tested) |
| Delete cancel | Choose "Keep task" | Card unchanged | ✅ 0 delete requests; unsaved edits kept |
| Delete success | Confirm, reload | Card stays deleted | ✅ Gone after reload; other cards untouched |
| Failed delete | Block the tasks API, confirm | Card stays; error shown | ✅ |
| Search and filter | Combine query and priority, then reset | Correct cards; data unchanged | ✅ Case-insensitive title match, combined filters, visible column counts, whole-board summary unchanged, reset restores all |
| Calendar boundaries | Yesterday/today/tomorrow across month, year, leap day, DST | Correct urgency; done excluded | ✅ Unit tests plus a browser run with real dates |
| Keyboard use | Tab through the page; use form and status controls | Visible focus; working alternative to drag | ✅ Logical order; status selector moves cards and keeps focus |
| Narrow viewport | Board and modal at phone width | Readable; nothing cut off | ✅ 500px wide: no sideways page scroll; modal scrolls inside itself on a 473px-tall screen. Real phone not tested by me |
| Touch | Quick tap, quick swipe, press-and-hold then drag | Scroll vs. drag kept separate | ✅ Tap opens the card; a quick swipe scrolls the board without dragging; holding about 0.2 s then moving drags the card into the column highlighted at release; holding without moving does nothing |
| Production build | `npm run build`, `npm run lint`, `npm test` | All pass | ✅ |
| Hosted smoke test | Repeat create/drop/refresh on the live URL | Same as local | ⏳ Not run yet: deployment is Task 14 |

## Database isolation (RLS)

Run with `npm run verify:rls` ([`scripts/verify-rls.mjs`](../scripts/verify-rls.mjs)). The script uses **only the public key** and two ordinary anonymous guest sessions, never a privileged key. Guest B attacks guest A's task, and A's row is re-read afterwards to prove it did not change. Positive controls confirm that A can still read and edit its own task, so a "0 rows" result cannot be caused by a broken setup. Test rows are deleted at the end.

Latest run: **24/24 checks passed** (2026-11-02, live Supabase project).

| Group | Check | Result | Evidence |
| --- | --- | --- | --- |
| Setup | Two distinct anonymous guests | ✅ | Different user IDs |
| Setup | Guests can create their own task | ✅ | A and B each inserted 1 row |
| Own data (control) | A reads own task | ✅ | 1 row |
| Own data (control) | A updates own task | ✅ | 1 row updated |
| Cross-user | B lists all tasks it can see | ✅ | 1 row (its own), none owned by A |
| Cross-user | B reads A's task by ID | ✅ | 0 rows returned |
| Cross-user | B updates A's task | ✅ | 0 rows affected |
| Cross-user | B bulk-updates every task where `user_id` = A | ✅ | 0 rows affected |
| Cross-user | B deletes A's task | ✅ | 0 rows affected |
| Cross-user | B inserts a task owned by A | ✅ | Rejected (`42501`) |
| Cross-user | B transfers its own task to A | ✅ | Rejected (`42501`) |
| Cross-user | B's task still owned by B | ✅ | Owner unchanged |
| Cross-user | B chooses its own `id` on insert | ✅ | Rejected (`42501`) |
| No session | Read tasks | ✅ | Rejected (`42501`) |
| No session | Insert a task | ✅ | Rejected (`42501`) |
| No session | Update A's task | ✅ | Rejected (`42501`) |
| No session | Delete A's task | ✅ | Rejected (`42501`) |
| Integrity | A's task unchanged after all attacks | ✅ | Every field identical to the snapshot |
| Constraints | Whitespace-only title | ✅ | Rejected (`23514`) |
| Constraints | Title over 200 characters | ✅ | Rejected (`23514`) |
| Constraints | Description over 2,000 characters | ✅ | Rejected (`23514`) |
| Constraints | Unknown status | ✅ | Rejected (`23514`) |
| Constraints | Unknown priority | ✅ | Rejected (`23514`) |
| Cleanup | Test rows deleted by their owners | ✅ | 2 rows |

**Reading the results:**

- **"0 row(s) affected"** is how Row Level Security hides other users' rows: the `USING` clause filters them out before the update or delete runs, so the request succeeds but touches nothing. The app treats zero affected rows as a failure, never as success.
- **`42501` (insufficient privilege)** means Postgres refused the request outright: either the `WITH CHECK` policy rejected a row owned by someone else, or the column-level grants forbid writing `user_id`, `id`, or `created_at`.
- **`23514` (check violation)** comes from the table's `CHECK` constraints, which enforce the same rules as the form.

## How the browser checks were judged

Each scenario prints one line per check, and a small checker compares every line with a written expected value. An earlier pass of this report (before the final design changes) only scanned the logs for failure words such as "false" or "error"; that method missed a wrongly empty value in the edit scenario, so the "126 checks passed" figure it produced was not reliable. The current figure comes from the exact-value comparison, run after the last code change.

The contrast audit had a similar blind spot: it could not read colors the browser reports in the `color(srgb …)` form (produced by the tinted columns' `color-mix()`), and an unreadable color silently counted as passing. The audit now parses that form and reports any color it cannot read; the tinted column text was then measured directly at 5.26–8.58:1.

## Known issues and limitations

- **Bundle size warning.** The production JavaScript bundle is about 500 KB (144 KB gzipped), just over Vite's 500 KB advisory limit, mostly React, supabase-js, and dnd-kit. Acceptable for a single-screen app; code-splitting is a possible improvement.
- **Anonymous sign-in rate limit.** Supabase limits new anonymous sign-ins per IP address (about 30 per hour on the free tier). Automated testing hit this limit; the app now shows a specific "please wait a few minutes" message with a retry button. Normal use (one guest per browser) is unaffected.
- **Test guests remain.** Every automated run creates anonymous users that stay in Authentication → Users; deleting them requires a privileged key, which this project deliberately never uses.
- **Edge auto-scroll on phones.** At phone width only part of the next column is visible, so dropping into it means holding the card near the screen edge, which auto-scrolls the board. How far it scrolls depends on how long the card is held; the card always lands in the highlighted column. The status selector is the precise alternative.
- **Not tested by me:** a physical phone, Safari, and Firefox. The hosted deployment is verified in Task 14.
