import { useState } from 'react'
import { useAuth } from './lib/useAuth'
import Auth from './Auth'
import BoardList from './BoardList'
import BoardView from './BoardView'
import './App.css'

function App() {
  const { session, loading } = useAuth()
  const [boardId, setBoardId] = useState<string | null>(null)

  if (loading) return null
  if (!session) return <Auth />
  if (!boardId) return <BoardList onOpenBoard={setBoardId} />
  return <BoardView boardId={boardId} onBack={() => setBoardId(null)} />
}

export default App
