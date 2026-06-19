import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { listBoards, createBoard, deleteBoard, type BoardSummary } from './lib/boards'

interface BoardListProps {
  onOpenBoard: (id: string) => void
}

export default function BoardList({ onOpenBoard }: BoardListProps) {
  const [boards, setBoards] = useState<BoardSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listBoards()
      .then(setBoards)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load boards'))
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const board = await createBoard(`Board ${new Date().toLocaleDateString()}`)
      onOpenBoard(board.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create board')
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this board? This cannot be undone.')) return
    try {
      await deleteBoard(id)
      setBoards((prev) => prev?.filter((b) => b.id !== id) ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete board')
    }
  }

  return (
    <div className="board-list-screen">
      <header className="board-list-header">
        <h1>My boards</h1>
        <div className="board-list-actions">
          <button type="button" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : 'New board'}
          </button>
          <button type="button" className="board-list-signout" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </header>
      {error && <p className="board-list-error">{error}</p>}
      {!boards ? (
        <p className="board-list-empty">Loading…</p>
      ) : boards.length === 0 ? (
        <p className="board-list-empty">No boards yet — create your first one.</p>
      ) : (
        <ul className="board-list-grid">
          {boards.map((board) => (
            <li key={board.id} className="board-card">
              <button type="button" className="board-card-open" onClick={() => onOpenBoard(board.id)}>
                <span className="board-card-thumb" aria-hidden="true" />
                <span className="board-card-name">{board.name}</span>
                <span className="board-card-date">{new Date(board.updated_at).toLocaleDateString()}</span>
              </button>
              <button
                type="button"
                className="board-card-delete"
                title="Delete board"
                onClick={() => handleDelete(board.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
