import { lazy, Suspense } from 'react'
import '@excalidraw/excalidraw/index.css'

const Board = lazy(() => import('./Board'))

interface BoardViewProps {
  boardId: string
  onBack: () => void
}

export default function BoardView({ boardId, onBack }: BoardViewProps) {
  return (
    <div className="board">
      <Suspense fallback={null}>
        <Board boardId={boardId} onBack={onBack} />
      </Suspense>
    </div>
  )
}
