import { Copy, Download, Pencil, Pin, PinOff, Trash2, Wifi, WifiOff } from 'lucide-react'
import type { DashboardBoard } from './types'

interface ContextMenuProps {
  board: DashboardBoard
  x: number
  y: number
  onRename: () => void
  onDuplicate: () => void
  onToggleOnline: () => void
  onTogglePinned: () => void
  onExport: () => void
  onDeleteRequest: () => void
}

export default function ContextMenu({
  board,
  x,
  y,
  onRename,
  onDuplicate,
  onToggleOnline,
  onTogglePinned,
  onExport,
  onDeleteRequest,
}: ContextMenuProps) {
  return (
    <div className="dash-menu" style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()}>
      <button type="button" className="dash-menu__item" onClick={onRename}>
        <Pencil size={14} /> Переименовать
      </button>
      <button type="button" className="dash-menu__item" onClick={onDuplicate}>
        <Copy size={14} /> Дублировать
      </button>
      <button type="button" className="dash-menu__item" onClick={onToggleOnline}>
        {board.isOnline ? <WifiOff size={14} /> : <Wifi size={14} />}
        {board.isOnline ? 'Закрыть для сети' : 'Открыть для сети'}
      </button>
      <button type="button" className="dash-menu__item" onClick={onTogglePinned}>
        {board.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        {board.pinned ? 'Открепить' : 'Закрепить'}
      </button>
      <button type="button" className="dash-menu__item" onClick={onExport}>
        <Download size={14} /> Экспорт
      </button>
      <div className="dash-menu__separator" />
      <button type="button" className="dash-menu__item dash-menu__item--danger" onClick={onDeleteRequest}>
        <Trash2 size={14} /> Удалить
      </button>
    </div>
  )
}
