import { KeyRound } from 'lucide-react'
import type { MouseEvent } from 'react'
import { formatBoardDate, previewGradient } from './utils'
import type { DashboardBoard } from './types'

interface BoardCardProps {
  board: DashboardBoard
  isRenaming: boolean
  onOpen: () => void
  onContextMenu: (e: MouseEvent) => void
  onRenameCommit: (name: string) => void
  onRenameCancel: () => void
}

export default function BoardCard({
  board,
  isRenaming,
  onOpen,
  onContextMenu,
  onRenameCommit,
  onRenameCancel,
}: BoardCardProps) {
  const shown = [...board.participants]
    .sort((a, b) => Number(b.isOnline) - Number(a.isOnline))
    .slice(0, 3)
  const extra = board.participants.length - shown.length

  return (
    <div className="dash-card" onClick={isRenaming ? undefined : onOpen} onContextMenu={onContextMenu}>
      <div className="dash-card__preview" style={{ background: previewGradient(board.id) }} />
      <div className="dash-card__body">
        <div className="dash-card__top">
          {isRenaming ? (
            <input
              className="dash-card__rename-input"
              autoFocus
              defaultValue={board.name}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameCommit(e.currentTarget.value)
                if (e.key === 'Escape') onRenameCancel()
              }}
              onBlur={(e) => onRenameCommit(e.currentTarget.value)}
            />
          ) : (
            <span className="dash-card__name" title={board.name}>
              {board.name}
            </span>
          )}
          <span className={`dash-card__status ${board.isOnline ? 'is-online' : 'is-offline'}`}>
            <span className="dash-card__status-dot" />
            {board.isOnline ? 'online' : 'offline'}
          </span>
        </div>

        {board.isOnline && board.roomCode && (
          <div className="dash-card__room-code">
            <KeyRound size={11} strokeWidth={2} />
            <span>#{board.roomCode}</span>
          </div>
        )}

        <div className="dash-card__date">{formatBoardDate(board.updatedAt)}</div>

        <div className="dash-card__avatars">
          {shown.map((p, i) => (
            <div key={p.id} className="dash-avatar" style={{ background: p.color, marginLeft: i ? -5 : 0 }}>
              {p.isOnline && <span className="dash-avatar__dot" />}
            </div>
          ))}
          {extra > 0 && <span className="dash-card__avatars-extra">+{extra}</span>}
        </div>
      </div>
    </div>
  )
}
