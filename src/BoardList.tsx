import { useEffect, useState, type MouseEvent } from 'react'
import { ArrowRight, LogOut, Plus } from 'lucide-react'
import { supabase } from './lib/supabase'
import {
  createBoard,
  deleteBoard,
  duplicateBoard,
  findBoardIdByRoomCode,
  getBoardExport,
  listJoinedBoards,
  listOwnedBoards,
  renameBoard,
  setBoardOnline,
  setBoardPinned,
  type BoardSummary,
} from './lib/boards'
import { useAuth } from './lib/useAuth'
import BoardSection from './dashboard/BoardSection'
import ContextMenu from './dashboard/ContextMenu'
import EnterRoomModal from './dashboard/EnterRoomModal'
import ConfirmDeleteModal from './dashboard/ConfirmDeleteModal'
import { colorForId, initialsForEmail } from './dashboard/utils'
import type { DashboardBoard } from './dashboard/types'
import './dashboard/Dashboard.css'

interface BoardListProps {
  onOpenBoard: (id: string) => void
}

interface ContextMenuState {
  x: number
  y: number
  board: DashboardBoard
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Что-то пошло не так'
}

export default function BoardList({ onOpenBoard }: BoardListProps) {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const userEmail = session?.user.email ?? ''

  const [ownedBoards, setOwnedBoards] = useState<DashboardBoard[] | null>(null)
  const [joinedBoards, setJoinedBoards] = useState<DashboardBoard[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DashboardBoard | null>(null)
  const [showEnterRoom, setShowEnterRoom] = useState(false)
  const [tooltip, setTooltip] = useState<'owned' | 'joined' | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  function toDashboardBoard(summary: BoardSummary, isOwner: boolean): DashboardBoard {
    return {
      ...summary,
      isOwner,
      participants: userId ? [{ id: userId, color: colorForId(userId), isOnline: false }] : [],
    }
  }

  useEffect(() => {
    listOwnedBoards()
      .then((boards) => setOwnedBoards(boards.map((b) => toDashboardBoard(b, true))))
      .catch((e) => setError(errorMessage(e)))
    listJoinedBoards()
      .then((boards) => setJoinedBoards(boards.map((b) => toDashboardBoard(b, false))))
      .catch((e) => setError(errorMessage(e)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  useEffect(() => {
    function closeAll() {
      setContextMenu(null)
      setTooltip(null)
      setUserMenuOpen(false)
    }
    document.addEventListener('click', closeAll)
    return () => document.removeEventListener('click', closeAll)
  }, [])

  function sortBoards(list: DashboardBoard[] | null): DashboardBoard[] | null {
    if (!list) return null
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    })
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const board = await createBoard()
      onOpenBoard(board.id)
    } catch (e) {
      setError(errorMessage(e))
      setCreating(false)
    }
  }

  function openContextMenu(e: MouseEvent, board: DashboardBoard) {
    e.preventDefault()
    const menuWidth = 200
    const menuHeight = 260
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 8)
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 8)
    setContextMenu({ x, y, board })
  }

  function startRename(board: DashboardBoard) {
    setRenamingId(board.id)
    setContextMenu(null)
  }

  async function commitRename(board: DashboardBoard, name: string) {
    setRenamingId(null)
    const trimmed = name.trim()
    if (!trimmed || trimmed === board.name) return
    try {
      await renameBoard(board.id, trimmed)
      setOwnedBoards((prev) => prev?.map((b) => (b.id === board.id ? { ...b, name: trimmed } : b)) ?? null)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function handleDuplicate(board: DashboardBoard) {
    setContextMenu(null)
    try {
      const created = await duplicateBoard(board.id)
      setOwnedBoards((prev) => (prev ? [toDashboardBoard(created, true), ...prev] : prev))
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function handleToggleOnline(board: DashboardBoard) {
    setContextMenu(null)
    try {
      const result = await setBoardOnline(board.id, !board.isOnline)
      setOwnedBoards((prev) => prev?.map((b) => (b.id === board.id ? { ...b, ...result } : b)) ?? null)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function handleTogglePinned(board: DashboardBoard) {
    setContextMenu(null)
    try {
      await setBoardPinned(board.id, !board.pinned)
      setOwnedBoards((prev) => prev?.map((b) => (b.id === board.id ? { ...b, pinned: !board.pinned } : b)) ?? null)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function handleExport(board: DashboardBoard) {
    setContextMenu(null)
    try {
      const { name, data } = await getBoardExport(board.id)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name || 'board'}.excalidraw`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  function requestDelete(board: DashboardBoard) {
    setDeleteTarget(board)
    setContextMenu(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    try {
      await deleteBoard(id)
      setOwnedBoards((prev) => prev?.filter((b) => b.id !== id) ?? null)
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function handleEnterRoom(code: string): Promise<boolean> {
    try {
      const id = await findBoardIdByRoomCode(code)
      if (!id) return false
      setShowEnterRoom(false)
      onOpenBoard(id)
      return true
    } catch {
      return false
    }
  }

  const initials = userEmail ? initialsForEmail(userEmail) : '?'
  const avatarColor = userId ? colorForId(userId) : '#7F77DD'
  const nickname = userEmail.split('@')[0] || 'Гость'

  return (
    <div className="dash">
      <header className="dash-header">
        <div
          className="dash-user"
          onClick={(e) => {
            e.stopPropagation()
            setUserMenuOpen((v) => !v)
          }}
        >
          <div className="dash-user__avatar" style={{ background: avatarColor }}>
            {initials}
          </div>
          <span className="dash-user__name">{nickname}</span>
          {userMenuOpen && (
            <div className="dash-user__menu" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => supabase.auth.signOut()}>
                <LogOut size={14} /> Выйти
              </button>
            </div>
          )}
        </div>

        <div className="dash-header__actions">
          <button type="button" className="dash-btn dash-btn--primary" onClick={handleCreate} disabled={creating}>
            <Plus size={15} /> New board
          </button>
          <button
            type="button"
            className="dash-btn dash-btn--ghost"
            onClick={(e) => {
              e.stopPropagation()
              setShowEnterRoom(true)
            }}
          >
            Enter the room <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {error && <p className="dash-error">{error}</p>}

      <BoardSection
        title="Ваши доски"
        tooltip="Доски, которые вы создали сами"
        tooltipOpen={tooltip === 'owned'}
        onToggleTooltip={(e) => {
          e.stopPropagation()
          setTooltip((t) => (t === 'owned' ? null : 'owned'))
        }}
        boards={sortBoards(ownedBoards)}
        emptyHint="Пока нет досок — создайте первую."
        renamingId={renamingId}
        onOpen={(board) => onOpenBoard(board.id)}
        onContextMenu={openContextMenu}
        onRenameCommit={commitRename}
        onRenameCancel={() => setRenamingId(null)}
      />

      <BoardSection
        title="Ваши комнаты"
        tooltip="Доски, к которым вы подключились по коду входа в комнату"
        tooltipOpen={tooltip === 'joined'}
        onToggleTooltip={(e) => {
          e.stopPropagation()
          setTooltip((t) => (t === 'joined' ? null : 'joined'))
        }}
        boards={sortBoards(joinedBoards)}
        emptyHint="Пока нет комнат, к которым вы подключились."
        renamingId={renamingId}
        onOpen={(board) => onOpenBoard(board.id)}
        onContextMenu={openContextMenu}
        onRenameCommit={commitRename}
        onRenameCancel={() => setRenamingId(null)}
      />

      {contextMenu && (
        <ContextMenu
          board={contextMenu.board}
          x={contextMenu.x}
          y={contextMenu.y}
          onRename={() => startRename(contextMenu.board)}
          onDuplicate={() => handleDuplicate(contextMenu.board)}
          onToggleOnline={() => handleToggleOnline(contextMenu.board)}
          onTogglePinned={() => handleTogglePinned(contextMenu.board)}
          onExport={() => handleExport(contextMenu.board)}
          onDeleteRequest={() => requestDelete(contextMenu.board)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.name}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {showEnterRoom && <EnterRoomModal onClose={() => setShowEnterRoom(false)} onSubmit={handleEnterRoom} />}
    </div>
  )
}
