# Kanban Task Board

A full-stack Kanban board built with Vite, React, TypeScript, and Supabase.

## Local development

Requires Node.js and npm.

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production into dist/
npm run lint     # run oxlint
```

Environment variables (from Task 4 onward): copy `.env.example` to `.env.local` and fill in your Supabase project values. Never commit real `.env` files.

## Supabase setup

1. Create a free project at [supabase.com](https://supabase.com) (New project → Free plan). Save the database password somewhere private; the app never needs it.
2. Open **SQL Editor** → **New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. It is safe to run again.
3. Run [`supabase/verify.sql`](supabase/verify.sql) the same way to confirm RLS, policies, and privileges.
4. Go to **Authentication** → **Sign In / Providers** and turn on **Allow anonymous sign-ins**. Save.
5. Go to **Project Settings** → **API Keys** (and **Data API** for the URL) and copy the Project URL and the public `anon` key into `.env.local`. Never use the `service_role` / secret key in this app.

Security model: each guest is an anonymous Supabase Auth user. Row Level Security policies on `public.tasks` only allow a user to read, create, update, or delete rows whose `user_id` equals their own `auth.uid()`. The public key in the browser cannot bypass these policies.

## Progress

Status key: ⬜ pending · 🟡 implemented, pending review · ✅ approved

| # | Task | Status |
| --- | --- | --- |
| 1 | Inspect and scaffold | ✅ approved |
| 2 | Visual board with local sample data | ✅ approved |
| 3 | SQL schema and RLS policies | ✅ approved (Supabase run confirmed by user) |
| 4 | Supabase client and guest sessions | ✅ approved |
| 5 | Load persisted board | ✅ approved |
| 6 | Create tasks | ✅ approved |
| 7 | Edit tasks and status selector | ✅ approved |
| 8 | Drag tasks across columns | ✅ approved |
| 9 | Delete tasks | ⬜ |
| 10 | Due-date indicators and summary | ⬜ |
| 11 | Search and priority filter | ⬜ |
| 12 | Usability and responsive polish | ⬜ |
| 13 | Verify functionality and isolation | ⬜ |
| 14 | GitHub and hosting | ⬜ |
| 15 | Final assessment document | ⬜ |

## Time log

| Task | Approx. time | Notes |
| --- | --- | --- |
| 1 | ~15 min | Scaffolded with create-vite (react-ts template), npm |
| 2 | ~30 min | Board, columns, cards, design tokens, sample data |
| 3 | ~20 min | schema.sql, verify.sql, setup docs |
| 4 | ~30 min | supabase-js client, env validation, guest session hook, status screens |
| 5 | ~25 min | listTasks service with runtime row checks, useTasks hook, load states |
| 6 | ~45 min | Modal, TaskForm, shared validation, createTask service, browser tests |
| 7 | ~50 min | updateTask, edit mode, optimistic status selector with rollback, pending guard |
| 8 | ~45 min | @dnd-kit/core 6.3.1, drop targets, drag handle, overlay, mouse + touch tests |

## Open issues

- Clearing browser storage or closing a private window loses access to that guest's board; there is no account recovery by design.
