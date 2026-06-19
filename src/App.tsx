import { lazy, Suspense } from 'react'
import '@excalidraw/excalidraw/index.css'
import './App.css'

const Excalidraw = lazy(() =>
  import('@excalidraw/excalidraw').then((module) => ({ default: module.Excalidraw })),
)

function App() {
  return (
    <div className="board">
      <Suspense fallback={null}>
        <Excalidraw />
      </Suspense>
    </div>
  )
}

export default App
