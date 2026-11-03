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

## Progress

Status key: ⬜ pending · 🟡 implemented, pending review · ✅ approved

| # | Task | Status |
| --- | --- | --- |
| 1 | Inspect and scaffold | ✅ approved |
| 2 | Visual board with local sample data | ✅ approved |
| 3 | SQL schema and RLS policies | ⬜ |
| 4 | Supabase client and guest sessions | ⬜ |
| 5 | Load persisted board | ⬜ |
| 6 | Create tasks | ⬜ |
| 7 | Edit tasks and status selector | ⬜ |
| 8 | Drag tasks across columns | ⬜ |
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

## Open issues

- None yet.
