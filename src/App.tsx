import { type JSX } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from './lib/useAuth'
import Auth from './Auth'
import BoardList from './BoardList'
import BoardView from './BoardView'
import './App.css'

function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/sign-in" replace />
  return children
}

function RequireGuest({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session) return <Navigate to="/" replace />
  return children
}

function BoardListRoute() {
  const navigate = useNavigate()
  return <BoardList onOpenBoard={(id) => navigate(`/whiteboard/${id}`)} />
}

function BoardViewRoute() {
  const { boardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  if (!boardId) return <Navigate to="/" replace />
  return <BoardView boardId={boardId} onBack={() => navigate('/')} />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/sign-in"
          element={
            <RequireGuest>
              <Auth mode="sign-in" />
            </RequireGuest>
          }
        />
        <Route
          path="/sign-up"
          element={
            <RequireGuest>
              <Auth mode="sign-up" />
            </RequireGuest>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <BoardListRoute />
            </RequireAuth>
          }
        />
        <Route
          path="/whiteboard/:boardId"
          element={
            <RequireAuth>
              <BoardViewRoute />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
