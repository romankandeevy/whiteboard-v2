import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import { useAuth } from './lib/useAuth'
import {
  listBoards,
  createBoard,
  deleteBoard,
  renameBoard,
  type BoardSummary,
} from './lib/boards'

interface BoardListProps {
  onOpenBoard: (id: string) => void
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr} hr${hr > 1 ? 's' : ''} ago`
  const day = Math.round(hr / 24)
  if (day < 7) return `${day} day${day > 1 ? 's' : ''} ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function BoardList({ onOpenBoard }: BoardListProps) {
  const { session } = useAuth()
  const [boards, setBoards] = useState<BoardSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [createBusy, setCreateBusy] = useState(false)
  const createInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listBoards()
      .then(setBoards)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load boards'))
  }, [])

  useEffect(() => {
    if (showCreate) {
      const t = setTimeout(() => createInputRef.current?.select(), 20)
      return () => clearTimeout(t)
    }
  }, [showCreate])

  const filtered = useMemo(() => {
    if (!boards) return null
    const q = query.trim().toLowerCase()
    if (!q) return boards
    return boards.filter((b) => b.name.toLowerCase().includes(q))
  }, [boards, query])

  function openCreate() {
    setNewName('Untitled board')
    setShowCreate(true)
  }

  async function handleCreate() {
    const name = newName.trim() || 'Untitled board'
    setCreateBusy(true)
    try {
      const board = await createBoard(name)
      onOpenBoard(board.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create board')
      setCreateBusy(false)
      setShowCreate(false)
    }
  }

  async function handleDelete(id: string) {
    setMenuId(null)
    if (!window.confirm('Delete this board? This can’t be undone.')) return
    const prev = boards
    setBoards((b) => b?.filter((x) => x.id !== id) ?? null)
    try {
      await deleteBoard(id)
    } catch (e) {
      setBoards(prev ?? null)
      setError(e instanceof Error ? e.message : 'Failed to delete board')
    }
  }

  function startRename(board: BoardSummary) {
    setMenuId(null)
    setRenamingId(board.id)
    setRenameValue(board.name)
  }

  async function commitRename(id: string) {
    const name = renameValue.trim()
    setRenamingId(null)
    const current = boards?.find((b) => b.id === id)
    if (!name || !current || name === current.name) return
    const prev = boards
    setBoards((b) => b?.map((x) => (x.id === id ? { ...x, name } : x)) ?? null)
    try {
      await renameBoard(id, name)
    } catch (e) {
      setBoards(prev ?? null)
      setError(e instanceof Error ? e.message : 'Failed to rename board')
    }
  }

  const email = session?.user?.email ?? ''

  return (
    <div className="dash">
      <div className="dash-grid-bg" aria-hidden="true" />

      <header className="dash-top">
        <div className="dash-brand">
          <span className="dash-mark">B</span>
          <span className="dash-wordmark">Board</span>
        </div>
        <div className="dash-user">
          <span className="dash-email" title={email}>
            {email}
          </span>
          <button
            type="button"
            className="dash-signout"
            onClick={() => supabase.auth.signOut()}
            title="Sign out"
          >
            <LogOut />
          </button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-hero">
          <div>
            <p className="eyebrow dash-eyebrow">Workspace</p>
            <h1 className="dash-title">Your boards</h1>
            <p className="dash-count">
              {boards === null
                ? 'Loading your canvas…'
                : boards.length === 0
                  ? 'A blank canvas awaits.'
                  : `${boards.length} board${boards.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="dash-hero-actions">
            <label className="dash-search">
              <Search />
              <input
                type="text"
                placeholder="Search boards"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button type="button" className="dash-new" onClick={openCreate}>
              <Plus />
              New board
            </button>
          </div>
        </div>

        {error && <p className="dash-error">{error}</p>}

        {filtered === null ? (
          <ul className="dash-list">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="board-card is-skeleton">
                <div className="board-thumb skeleton" />
                <div className="board-meta">
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <EmptyState hasBoards={(boards?.length ?? 0) > 0} onCreate={openCreate} />
        ) : (
          <ul className="dash-list">
            {filtered.map((board, i) => {
              return (
                <motion.li
                  key={board.id}
                  className="board-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.3) }}
                >
                  <button
                    type="button"
                    className="board-open"
                    onClick={() => onOpenBoard(board.id)}
                    aria-label={`Open ${board.name}`}
                  >
                    <span className="board-thumb">
                      <span className="board-thumb-initial">
                        {board.name.trim().charAt(0).toUpperCase() || 'B'}
                      </span>
                    </span>
                  </button>

                  <div className="board-meta">
                    {renamingId === board.id ? (
                      <input
                        className="board-rename"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(board.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename(board.id)
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="board-name"
                        onClick={() => onOpenBoard(board.id)}
                        onDoubleClick={() => startRename(board)}
                        title={board.name}
                      >
                        {board.name}
                      </button>
                    )}
                    <span className="board-date">{timeAgo(board.updated_at)}</span>
                  </div>

                  <button
                    type="button"
                    className="board-menu-btn"
                    onClick={() => setMenuId((id) => (id === board.id ? null : board.id))}
                    aria-label="Board actions"
                  >
                    <MoreHorizontal />
                  </button>

                  {menuId === board.id && (
                    <>
                      <div className="board-menu-backdrop" onClick={() => setMenuId(null)} />
                      <div className="board-menu">
                        <button type="button" onClick={() => startRename(board)}>
                          <Pencil />
                          Rename
                        </button>
                        <button
                          type="button"
                          className="is-danger"
                          onClick={() => handleDelete(board.id)}
                        >
                          <Trash2 />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </motion.li>
              )
            })}
          </ul>
        )}
      </main>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => !createBusy && setShowCreate(false)}>
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">Name your board</h2>
            <p className="modal-sub">You can rename it any time.</p>
            <input
              ref={createInputRef}
              className="modal-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setShowCreate(false)
              }}
              placeholder="Untitled board"
              maxLength={80}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setShowCreate(false)}
                disabled={createBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-create"
                onClick={handleCreate}
                disabled={createBusy}
              >
                {createBusy ? 'Creating…' : 'Create board'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasBoards, onCreate }: { hasBoards: boolean; onCreate: () => void }) {
  if (hasBoards) {
    return (
      <div className="dash-empty">
        <p>No boards match your search.</p>
      </div>
    )
  }
  return (
    <div className="dash-empty">
      <div className="dash-empty-art" aria-hidden="true">
        <svg viewBox="0 0 160 110" fill="none">
          <rect
            x="1"
            y="1"
            width="158"
            height="108"
            fill="var(--paper)"
            stroke="var(--ink-900)"
            strokeWidth="2"
          />
          <g stroke="var(--border)" strokeWidth="1">
            <line x1="40" y1="1" x2="40" y2="109" />
            <line x1="80" y1="1" x2="80" y2="109" />
            <line x1="120" y1="1" x2="120" y2="109" />
            <line x1="1" y1="37" x2="159" y2="37" />
            <line x1="1" y1="73" x2="159" y2="73" />
          </g>
          <polyline
            points="16,86 52,86 52,58 92,58 92,34 132,34 132,20"
            fill="none"
            stroke="var(--blue)"
            strokeWidth="3"
          />
          <circle cx="16" cy="86" r="3.5" fill="var(--ink-900)" />
          <circle cx="132" cy="20" r="3.5" fill="var(--blue)" />
        </svg>
      </div>
      <h2 className="dash-empty-title">Your canvas is empty</h2>
      <p className="dash-empty-sub">Create your first board and start sketching ideas.</p>
      <button type="button" className="dash-new" onClick={onCreate}>
        <Plus />
        New board
      </button>
    </div>
  )
}
