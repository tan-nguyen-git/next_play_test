import { useState } from 'react'
import Board from './components/Board'
import { SAMPLE_TASKS } from './data/sampleTasks'
import type { Task } from './types/task'

// App owns the canonical task list and passes it down as props.
// For Task 2 it starts from local sample data; later it comes from Supabase.
function App() {
  const [tasks] = useState<Task[]>(SAMPLE_TASKS)

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" aria-hidden="true" />
          <div>
            <h1 className="app-header__title">Task Board</h1>
            <p className="app-header__subtitle">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </p>
          </div>
        </div>
        <span className="app-header__badge">Sample data</span>
      </header>
      <main className="app-main">
        <Board tasks={tasks} />
      </main>
    </div>
  )
}

export default App
