# Kanban Task Board

**Live demo:** https://next-play-test-seven.vercel.app  
**Repository:** https://github.com/tan-nguyen-git/next_play_test

A polished Kanban board where every visitor automatically gets a private guest board. Create tasks, drag them between **To Do**, **In Progress**, **In Review**, and **Done**, and pick up where you left off after a refresh. Tasks are stored in Supabase and protected by PostgreSQL Row Level Security, so each guest can only ever read or change their own work.

## Features

**Board**
- Four fixed columns, each tinted in its stage color, with live task counts
- Drag a card from anywhere on it: mouse drags start after a few pixels; on touch screens, press and hold briefly, so a quick swipe still scrolls the board
- Moves appear instantly and are saved in the background; if a save fails, only that card returns to its column and an error explains what happened
- Every card also has a status selector, a keyboard-friendly alternative to dragging

**Tasks**
- Create, edit, and delete tasks with a title, description, priority (low / normal / high), and due date
- Validation for blank or overly long text, matched by database constraints
- Delete asks for confirmation first, and a failed save never discards what you typed

**Staying on top of work**
- Overdue, due-today, and due-tomorrow badges, based on calendar days in your local time zone
- Whole-board summary: total, completed, overdue, and percent done
- Search by title and filter by priority, with clear empty and no-match states

**Quality**
- Loading skeleton, clear error states with retry, and helpful empty states
- Keyboard accessible, screen reader labels, WCAG AA text contrast, and a responsive layout that scrolls sideways on phones

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Drag and drop | @dnd-kit/core |
| Styling | Plain CSS with design tokens |
| Database and auth | Supabase (PostgreSQL, anonymous Auth, Row Level Security) |
| Tests | Node's built-in test runner (date logic) and a live RLS verification script |

There is no custom backend server: the browser talks to Supabase directly with the public key, and the database enforces who can see what.

## How guest accounts and security work

1. On the first visit, the app signs in anonymously with Supabase Auth. The session is stored in the browser, so a refresh restores the same guest instead of creating a new one.
2. Every task row stores the guest's `user_id`.
3. Row Level Security policies on `public.tasks` only allow reading, creating, updating, or deleting rows where `user_id = auth.uid()`. Column-level grants also stop clients from changing `user_id`, `id`, or `created_at`.
4. The public key in the browser cannot bypass these rules. No service-role or secret key is used anywhere in this project.

Because guests have no email or password, clearing the site's data or closing a private window ends that guest session, and its board cannot be recovered.

## Getting started

**Prerequisites:** Node.js 22.12 or newer, npm, and a free [Supabase](https://supabase.com) account.

### 1. Install

```bash
npm install
```

### 2. Set up Supabase

1. Create a new project (Free plan).
2. Open **SQL Editor** → **New query**, paste [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. The script is safe to run more than once.
3. Optionally run [`supabase/verify.sql`](supabase/verify.sql) to confirm RLS, the four policies, and the privileges.
4. Go to **Authentication** → **Sign In / Providers** and turn on **Allow anonymous sign-ins**.

### 3. Add environment variables

Copy the example file and fill in your project's values:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | **Project Settings** → **Data API** → Project URL (just the base URL, without `/rest/v1/`) |
| `VITE_SUPABASE_ANON_KEY` | **Project Settings** → **API Keys** → the public `anon` or publishable key |

These values are public by design: anything prefixed with `VITE_` is bundled into the browser code. Data is protected by Row Level Security, not by hiding the key. Never put a service-role or secret key in this app, and never commit `.env.local`.

### 4. Run

```bash
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run oxlint |
| `npm test` | Run the date logic tests |
| `npm run verify:rls` | Sign in as two real guests and attempt cross-user reads, edits, deletes, and ownership changes against your Supabase project, then confirm nothing leaked or changed |

## Project structure

```text
src/
  components/   Board, columns, cards, task form, dialog, toolbar, summary, icons
  hooks/        useGuestSession, useTasks, useToday
  lib/          Supabase client and environment checks
  services/     Typed task reads and writes
  types/        Task, TaskStatus, TaskPriority
  utils/        Dates, validation, filtering, stats
supabase/       schema.sql and verify.sql
scripts/        verify-rls.mjs
tests/          Date logic tests
docs/           VERIFICATION.md
```

## Verification

[`docs/VERIFICATION.md`](docs/VERIFICATION.md) records what was tested and the actual results: 24/24 database isolation checks, 120 browser checks covering every feature and failure path (passing both locally and on the live site), 11 date logic tests, and accessibility audits.

## Known limitations

- A guest board belongs to one browser. There is no sign-in to move it to another device.
- Cards appear in creation order within a column; custom ordering inside a column is not saved.
- Changes made in another tab appear after a refresh (no realtime sync).

## Development log

Built in small, reviewed steps.

| # | Step | Status |
| --- | --- | --- |
| 1 | Scaffold | ✅ |
| 2 | Visual board | ✅ |
| 3 | SQL schema and RLS | ✅ |
| 4 | Supabase client and guest sessions | ✅ |
| 5 | Load persisted board | ✅ |
| 6 | Create tasks | ✅ |
| 7 | Edit tasks and status selector | ✅ |
| 8 | Drag and drop | ✅ |
| 9 | Delete tasks | ✅ |
| 10 | Due-date indicators and summary | ✅ |
| 11 | Search and filtering | ✅ |
| 12 | Usability and responsive polish | ✅ |
| 13 | Verification and design pass | ✅ |
| 14 | GitHub and hosting | ✅ |
| 15 | Final assessment document | ✅ |

Approximate time: about 8 hours across steps 1–13, including design iterations and verification.
