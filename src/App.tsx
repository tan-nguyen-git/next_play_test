// App is the root component. For now it only renders the page shell;
// later tasks add the guest session, the board, and the task modal here.
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Kanban Task Board</h1>
      </header>
      <main className="app-main">
        <p className="app-placeholder">The board will appear here.</p>
      </main>
    </div>
  )
}

export default App
