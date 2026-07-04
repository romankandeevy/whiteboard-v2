import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

interface CodeInputProps {
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  length?: number
  autoFocus?: boolean
}

export default function CodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  length = 6,
  autoFocus = true,
}: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function commit(next: string) {
    const clean = next.replace(/\D/g, '').slice(0, length)
    onChange(clean)
    if (clean.length === length) onComplete?.(clean)
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1)
    if (!char) return
    const chars = digits.slice()
    chars[index] = char
    commit(chars.join(''))
    if (index < length - 1) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const chars = digits.slice()
      if (chars[index]) {
        chars[index] = ''
        commit(chars.join(''))
      } else if (index > 0) {
        chars[index - 1] = ''
        commit(chars.join(''))
        refs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    commit(pasted)
    const focusAt = Math.min(pasted.length, length - 1)
    refs.current[focusAt]?.focus()
  }

  return (
    <div className="code-input" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className={`code-cell${digit ? ' is-filled' : ''}`}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  )
}
