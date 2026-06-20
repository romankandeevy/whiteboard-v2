export const AVATAR_COLORS = ['#7F77DD', '#1D9E75', '#D85A30', '#D4537E', '#378ADD', '#BA7517']

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

export function colorForId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function initialsForEmail(email: string): string {
  const local = email.split('@')[0] ?? ''
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase() || '?'
}

export function formatBoardDate(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const month = MONTHS[d.getMonth()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${month}, ${hh}.${mm}`
}

export function previewGradient(id: string): string {
  const a = colorForId(id)
  const b = colorForId(`${id}-b`)
  return `linear-gradient(135deg, ${a}40, ${b}26)`
}
