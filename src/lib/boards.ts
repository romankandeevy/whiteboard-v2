import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types'
import { supabase } from './supabase'

export interface BoardSummary {
  id: string
  name: string
  updated_at: string
}

const EMPTY_BOARD: ExcalidrawInitialDataState = { elements: [], appState: {}, files: {} }

export async function listBoards(): Promise<BoardSummary[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('id, name, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createBoard(name: string): Promise<BoardSummary> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('boards')
    .insert({ name, user_id: userId, data: EMPTY_BOARD })
    .select('id, name, updated_at')
    .single()
  if (error) throw error
  return data
}

export async function getBoard(id: string): Promise<ExcalidrawInitialDataState> {
  const { data, error } = await supabase.from('boards').select('data').eq('id', id).single()
  if (error) throw error
  return (data?.data as ExcalidrawInitialDataState) ?? EMPTY_BOARD
}

export async function saveBoard(id: string, data: ExcalidrawInitialDataState): Promise<void> {
  const { error } = await supabase
    .from('boards')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteBoard(id: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', id)
  if (error) throw error
}
