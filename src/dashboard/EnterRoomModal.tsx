import { Fragment, useRef, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

const CELL_COUNT = 6

interface EnterRoomModalProps {
  onClose: () => void
  onSubmit: (code: string) => Promise<boolean>
}

export default function EnterRoomModal({ onClose, onSubmit }: EnterRoomModalProps) {
  const [values, setValues] = useState<string[]>(Array(CELL_COUNT).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  async function submit(chars: string[]) {
    const formatted = `${chars.slice(0, 3).join('')}-${chars.slice(3).join('')}`
    setSubmitting(true)
    setError(null)
    const found = await onSubmit(formatted)
    setSubmitting(false)
    if (!found) {
      setError('Комната не найдена')
      setValues(Array(CELL_COUNT).fill(''))
      inputsRef.current[0]?.focus()
    }
  }

  function handleChange(index: number, raw: string) {
    const char = raw.slice(-1).toUpperCase()
    const next = [...values]
    next[index] = char
    setValues(next)
    setError(null)
    if (char && index < CELL_COUNT - 1) inputsRef.current[index + 1]?.focus()
    if (next.every(Boolean)) void submit(next)
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !values[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div className="dash-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="dash-modal__close" onClick={onClose} aria-label="Закрыть">
          <X size={16} />
        </button>
        <h2 className="dash-modal__title">Enter the room code</h2>
        <div className="dash-room-input">
          <span className="dash-room-input__hash">#</span>
          {values.map((value, i) => (
            <Fragment key={i}>
              <input
                ref={(el) => {
                  inputsRef.current[i] = el
                }}
                className="dash-room-input__cell"
                value={value}
                maxLength={1}
                disabled={submitting}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
              />
              {i === 2 && <span className="dash-room-input__dash">–</span>}
            </Fragment>
          ))}
        </div>
        {error && <p className="dash-modal__error">{error}</p>}
      </div>
    </div>
  )
}
