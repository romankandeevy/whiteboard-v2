import type { BoardSummary } from '../lib/boards'

export interface DashboardParticipant {
  id: string
  color: string
  isOnline: boolean
}

export interface DashboardBoard extends BoardSummary {
  isOwner: boolean
  participants: DashboardParticipant[]
}
