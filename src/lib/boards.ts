import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types'
import { supabase } from './supabase'

export interface BoardSummary {
  id: string
  name: string
  pinned: boolean
  isOnline: boolean
  roomCode: string | null
  updatedAt: string
  lastOpenedAt: string
}

interface BoardRow {
  id: string
  name: string
  pinned: boolean
  is_online: boolean
  room_code: string | null
  updated_at: string
  last_opened_at: string
}

const EMPTY_BOARD: ExcalidrawInitialDataState = { elements: [], appState: {}, files: {} }
const SUMMARY_FIELDS = 'id, name, pinned, is_online, room_code, updated_at, last_opened_at'
const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function toSummary(row: BoardRow): BoardSummary {
  return {
    id: row.id,
    name: row.name,
    pinned: row.pinned,
    isOnline: row.is_online,
    roomCode: row.room_code,
    updatedAt: row.updated_at,
    lastOpenedAt: row.last_opened_at,
  }
}

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id
  if (!userId) throw new Error('Not authenticated')
  return userId
}

export async function listOwnedBoards(): Promise<BoardSummary[]> {
  const { data, error } = await supabase
    .from('boards')
    .select(SUMMARY_FIELDS)
    .order('last_opened_at', { ascending: false })
  if (error) throw error
  return (data as BoardRow[]).map(toSummary)
}

// Joining other users' boards by room code isn't wired up on the backend yet
// (no membership table, no cross-account RLS), so this section has no data to show.
export async function listJoinedBoards(): Promise<BoardSummary[]> {
  return []
}

export async function createBoard(): Promise<BoardSummary> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('boards')
    .insert({ name: 'Untitled', user_id: userId, data: EMPTY_BOARD })
    .select(SUMMARY_FIELDS)
    .single()
  if (error) throw error
  return toSummary(data as BoardRow)
}

export async function duplicateBoard(id: string): Promise<BoardSummary> {
  const userId = await requireUserId()
  const { data: source, error: fetchError } = await supabase
    .from('boards')
    .select('name, data')
    .eq('id', id)
    .single()
  if (fetchError) throw fetchError
  const { data, error } = await supabase
    .from('boards')
    .insert({ name: `${source.name} copy`, user_id: userId, data: source.data })
    .select(SUMMARY_FIELDS)
    .single()
  if (error) throw error
  return toSummary(data as BoardRow)
}

export async function renameBoard(id: string, name: string): Promise<void> {
  const { error } = await supabase.from('boards').update({ name }).eq('id', id)
  if (error) throw error
}

export function generateRoomCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`
}

export async function setBoardOnline(
  id: string,
  online: boolean,
): Promise<{ isOnline: boolean; roomCode: string | null }> {
  const roomCode = online ? generateRoomCode() : null
  const { error } = await supabase
    .from('boards')
    .update({ is_online: online, room_code: roomCode })
    .eq('id', id)
  if (error) throw error
  return { isOnline: online, roomCode }
}

export async function setBoardPinned(id: string, pinned: boolean): Promise<void> {
  const { error } = await supabase.from('boards').update({ pinned }).eq('id', id)
  if (error) throw error
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', id)
  if (error) throw error
}

export async function touchLastOpened(id: string): Promise<void> {
  await supabase
    .from('boards')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', id)
}

export async function getBoard(id: string): Promise<ExcalidrawInitialDataState> {
  const { data, error } = await supabase.from('boards').select('data').eq('id', id).single()
  if (error) throw error
  return (data?.data as ExcalidrawInitialDataState) ?? EMPTY_BOARD
}

export async function getBoardExport(
  id: string,
): Promise<{ name: string; data: ExcalidrawInitialDataState }> {
  const { data, error } = await supabase.from('boards').select('name, data').eq('id', id).single()
  if (error) throw error
  return { name: data.name as string, data: (data.data as ExcalidrawInitialDataState) ?? EMPTY_BOARD }
}

export async function saveBoard(id: string, data: ExcalidrawInitialDataState): Promise<void> {
  const { error } = await supabase
    .from('boards')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function findBoardIdByRoomCode(code: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('boards')
    .select('id')
    .eq('room_code', code)
    .eq('is_online', true)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}
