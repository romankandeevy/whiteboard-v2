import type { MouseEvent } from 'react'
import BoardCard from './BoardCard'
import type { DashboardBoard } from './types'

interface BoardSectionProps {
  title: string
  tooltip: string
  tooltipOpen: boolean
  onToggleTooltip: (e: MouseEvent) => void
  boards: DashboardBoard[] | null
  emptyHint: string
  renamingId: string | null
  onOpen: (board: DashboardBoard) => void
  onContextMenu: (e: MouseEvent, board: DashboardBoard) => void
  onRenameCommit: (board: DashboardBoard, name: string) => void
  onRenameCancel: () => void
}

export default function BoardSection({
  title,
  tooltip,
  tooltipOpen,
  onToggleTooltip,
  boards,
  emptyHint,
  renamingId,
  onOpen,
  onContextMenu,
  onRenameCommit,
  onRenameCancel,
}: BoardSectionProps) {
  return (
    <section className="dash-section">
      <div className="dash-section__heading">
        <h2>{title}</h2>
        <button type="button" className="dash-help" onClick={onToggleTooltip} aria-label="Помощь">
          ?
        </button>
        {tooltipOpen && (
          <div className="dash-tooltip" onClick={(e) => e.stopPropagation()}>
            {tooltip}
          </div>
        )}
      </div>

      {!boards ? (
        <p className="dash-section__loading">Загрузка…</p>
      ) : boards.length === 0 ? (
        <p className="dash-section__empty">{emptyHint}</p>
      ) : (
        <div className="dash-grid">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              isRenaming={renamingId === board.id}
              onOpen={() => onOpen(board)}
              onContextMenu={(e) => onContextMenu(e, board)}
              onRenameCommit={(name) => onRenameCommit(board, name)}
              onRenameCancel={onRenameCancel}
            />
          ))}
        </div>
      )}
    </section>
  )
}
