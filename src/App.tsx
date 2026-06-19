import { lazy, Suspense } from 'react'
import '@excalidraw/excalidraw/index.css'
import './App.css'

const Board = lazy(() => import('./Board'))

function App() {
  return (
    <div className="board">
      <Suspense fallback={null}>
        <Board />
      </Suspense>
    </div>
  )
}

export default App
