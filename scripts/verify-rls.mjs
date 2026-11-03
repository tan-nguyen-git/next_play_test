// Verifies database isolation against the real Supabase project using ONLY the
// public key and ordinary anonymous guest sessions (never a privileged key).
//
//   npm run verify:rls
//
// Guest B attacks guest A's task; A's row is re-read afterwards to prove it is
// unchanged. Test rows are deleted at the end. No keys, tokens, or full user IDs
// are printed.
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL?.trim()
const key = process.env.VITE_SUPABASE_ANON_KEY?.trim()
if (!url || !key) {
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (for example in .env.local).')
  process.exit(1)
}

const COLUMNS = 'id, title, status, user_id, created_at, description, priority, due_date'
const newClient = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const short = (id) => `${id.slice(0, 8)}…`
const results = []

function record(group, name, pass, detail) {
  results.push({ group, name, pass, detail })
}

// A request is "blocked" when Postgres refuses it or it touches zero rows.
function blocked({ error, data }, verb = 'affected') {
  if (error) return { ok: true, detail: `rejected (${error.code ?? 'error'})` }
  const rows = Array.isArray(data) ? data.length : data ? 1 : 0
  return { ok: rows === 0, detail: `${rows} row(s) ${verb}` }
}

function rejectedWith(code, { error }) {
  return { ok: error?.code === code, detail: error ? `rejected (${error.code})` : 'accepted' }
}

async function signIn(label) {
  const client = newClient()
  const { data, error } = await client.auth.signInAnonymously()
  if (error || !data.user) throw new Error(`Could not sign in guest ${label}: ${error?.message ?? 'no user'}`)
  return { client, id: data.user.id }
}

async function readOwn(guest, taskId) {
  const { data, error } = await guest.client.from('tasks').select(COLUMNS).eq('id', taskId).maybeSingle()
  if (error) throw error
  return data
}

const a = await signIn('A')
const b = await signIn('B')
const anon = newClient()
record('Setup', 'Two distinct anonymous guests', a.id !== b.id, `A=${short(a.id)} B=${short(b.id)}`)

const insertA = await a.client
  .from('tasks')
  .insert({ user_id: a.id, title: 'RLS check: A task', description: 'original' })
  .select(COLUMNS)
  .single()
const insertB = await b.client
  .from('tasks')
  .insert({ user_id: b.id, title: 'RLS check: B task' })
  .select(COLUMNS)
  .single()
if (insertA.error || insertB.error) {
  console.error('Setup failed; cannot run isolation checks.', insertA.error?.code, insertB.error?.code)
  process.exit(1)
}
const taskA = insertA.data
const taskB = insertB.data
record('Setup', 'Guests can create their own task', true, 'A and B each inserted 1 row')

try {
  // ---------- Positive controls: the setup really works ----------
  const ownRead = await a.client.from('tasks').select(COLUMNS).eq('id', taskA.id)
  record('Own data', 'A reads own task', ownRead.data?.length === 1, `${ownRead.data?.length ?? 0} row(s)`)
  const ownUpdate = await a.client.from('tasks').update({ status: 'in_progress' }).eq('id', taskA.id).select('id')
  record('Own data', 'A updates own task', ownUpdate.data?.length === 1, `${ownUpdate.data?.length ?? 0} row(s) updated`)
  await a.client.from('tasks').update({ status: 'todo' }).eq('id', taskA.id)
  const snapshot = await readOwn(a, taskA.id)

  // ---------- Guest B against guest A ----------
  const listB = await b.client.from('tasks').select(COLUMNS)
  record(
    'Cross-user',
    'B lists all tasks it can see',
    !listB.error && listB.data.every((row) => row.user_id === b.id),
    `${listB.data?.length ?? 0} row(s), none owned by A`,
  )
  let r = blocked(await b.client.from('tasks').select(COLUMNS).eq('id', taskA.id), 'returned')
  record('Cross-user', "B reads A's task by id", r.ok, r.detail)
  r = blocked(await b.client.from('tasks').update({ title: 'hacked by B' }).eq('id', taskA.id).select('id'))
  record('Cross-user', "B updates A's task", r.ok, r.detail)
  r = blocked(await b.client.from('tasks').update({ status: 'done' }).eq('user_id', a.id).select('id'))
  record('Cross-user', "B bulk-updates all of A's tasks", r.ok, r.detail)
  r = blocked(await b.client.from('tasks').delete().eq('id', taskA.id).select('id'))
  record('Cross-user', "B deletes A's task", r.ok, r.detail)
  r = rejectedWith('42501', await b.client.from('tasks').insert({ user_id: a.id, title: 'planted by B' }).select('id'))
  record('Cross-user', 'B inserts a task owned by A', r.ok, r.detail)
  r = rejectedWith('42501', await b.client.from('tasks').update({ user_id: a.id }).eq('id', taskB.id).select('id'))
  record('Cross-user', 'B transfers its own task to A', r.ok, r.detail)
  const stillB = await readOwn(b, taskB.id)
  record('Cross-user', "B's task still owned by B", stillB?.user_id === b.id, stillB ? 'owner unchanged' : 'missing')
  r = rejectedWith(
    '42501',
    await b.client.from('tasks').insert({ id: crypto.randomUUID(), user_id: b.id, title: 'chosen id' }).select('id'),
  )
  record('Cross-user', 'B chooses its own id on insert', r.ok, r.detail)

  // ---------- No session at all ----------
  r = blocked(await anon.from('tasks').select(COLUMNS), 'returned')
  record('No session', 'Read tasks', r.ok, r.detail)
  r = blocked(await anon.from('tasks').insert({ user_id: a.id, title: 'anonymous insert' }).select('id'))
  record('No session', 'Insert a task', r.ok, r.detail)
  r = blocked(await anon.from('tasks').update({ title: 'anonymous edit' }).eq('id', taskA.id).select('id'))
  record('No session', "Update A's task", r.ok, r.detail)
  r = blocked(await anon.from('tasks').delete().eq('id', taskA.id).select('id'))
  record('No session', "Delete A's task", r.ok, r.detail)

  // ---------- A's row after every attack ----------
  const after = await readOwn(a, taskA.id)
  const unchanged =
    after !== null &&
    ['title', 'status', 'user_id', 'description', 'priority', 'due_date', 'created_at'].every(
      (field) => after[field] === snapshot[field],
    )
  record('Integrity', "A's task is unchanged after all attacks", unchanged, unchanged ? 'every field identical' : 'CHANGED')

  // ---------- Database constraints ----------
  const constraint = async (name, row) => {
    const res = rejectedWith('23514', await a.client.from('tasks').insert({ user_id: a.id, ...row }).select('id'))
    record('Constraints', name, res.ok, res.detail)
  }
  await constraint('Whitespace-only title', { title: '   ' })
  await constraint('Title over 200 characters', { title: 'x'.repeat(201) })
  await constraint('Description over 2,000 characters', { title: 'ok', description: 'x'.repeat(2001) })
  await constraint('Unknown status', { title: 'ok', status: 'archived' })
  await constraint('Unknown priority', { title: 'ok', priority: 'urgent' })
} finally {
  // ---------- Cleanup ----------
  const delA = await a.client.from('tasks').delete().eq('user_id', a.id).select('id')
  const delB = await b.client.from('tasks').delete().eq('user_id', b.id).select('id')
  record('Cleanup', 'Test rows deleted by their owners', !delA.error && !delB.error, `${(delA.data?.length ?? 0) + (delB.data?.length ?? 0)} row(s)`)
}

// ---------- Report ----------
const width = Math.max(...results.map((row) => row.name.length))
let group = ''
for (const row of results) {
  if (row.group !== group) {
    group = row.group
    console.log(`\n${group}`)
  }
  console.log(`  ${row.pass ? 'PASS' : 'FAIL'}  ${row.name.padEnd(width)}  ${row.detail}`)
}
const failed = results.filter((row) => !row.pass).length
console.log(`\n${results.length - failed}/${results.length} checks passed.`)
console.log('Note: the two temporary anonymous users remain in Authentication > Users (removing them needs a privileged key).')
process.exit(failed ? 1 : 0)
