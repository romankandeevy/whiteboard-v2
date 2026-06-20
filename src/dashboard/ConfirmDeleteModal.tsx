interface ConfirmDeleteModalProps {
  name: string
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDeleteModal({ name, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  return (
    <div className="dash-modal-overlay" onClick={onCancel}>
      <div className="dash-modal dash-modal--confirm" onClick={(e) => e.stopPropagation()}>
        <h2 className="dash-modal__title">Удалить доску?</h2>
        <p className="dash-modal__text">«{name}» будет удалена без возможности восстановления.</p>
        <div className="dash-modal__actions">
          <button type="button" className="dash-btn dash-btn--ghost" onClick={onCancel}>
            Отмена
          </button>
          <button type="button" className="dash-btn dash-btn--danger" onClick={onConfirm}>
            Удалить
          </button>
        </div>
      </div>
    </div>
  )
}
