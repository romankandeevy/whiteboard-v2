import { useEffect, useRef, useState } from 'react'
import {
  Excalidraw,
  MainMenu,
  WelcomeScreen,
  FONT_FAMILY,
  CaptureUpdateAction,
  serializeAsJSON,
} from '@excalidraw/excalidraw'
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
  ExcalidrawInitialDataState,
} from '@excalidraw/excalidraw/types'
import type { OrderedExcalidrawElement } from '@excalidraw/excalidraw/element/types'
import { getBoard, saveBoard } from './lib/boards'

const DOT_GRID_KEY = 'whiteboard:dotGrid'
const DOT_GAP = 24
const SAVE_DEBOUNCE_MS = 800

interface BoardProps {
  boardId: string
  onBack: () => void
}

export default function Board({ boardId, onBack }: BoardProps) {
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(null)
  const [dotGrid, setDotGrid] = useState(() => localStorage.getItem(DOT_GRID_KEY) === '1')
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const realBackgroundRef = useRef('#ffffff')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    getBoard(boardId).then((data) => {
      if (cancelled) return
      const bg = data.appState?.viewBackgroundColor
      if (bg && bg !== 'transparent') realBackgroundRef.current = bg
      setInitialData(data)
    })
    return () => {
      cancelled = true
    }
  }, [boardId])

  useEffect(() => {
    localStorage.setItem(DOT_GRID_KEY, dotGrid ? '1' : '0')
    const api = apiRef.current
    if (!api) return
    api.updateScene({
      appState: { viewBackgroundColor: dotGrid ? 'transparent' : realBackgroundRef.current },
      captureUpdate: CaptureUpdateAction.NEVER,
    })
  }, [dotGrid])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  function updateDotOffset(scrollX: number, scrollY: number, zoomValue: number) {
    const el = containerRef.current
    if (!el) return
    const gap = DOT_GAP * zoomValue
    const posX = (((scrollX * zoomValue) % gap) + gap) % gap
    const posY = (((scrollY * zoomValue) % gap) + gap) % gap
    el.style.setProperty('--dot-gap', `${gap}px`)
    el.style.setProperty('--dot-pos-x', `${posX}px`)
    el.style.setProperty('--dot-pos-y', `${posY}px`)
  }

  function scheduleSave(
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) {
    if (appState.viewBackgroundColor !== 'transparent') {
      realBackgroundRef.current = appState.viewBackgroundColor
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const payload = JSON.parse(
        serializeAsJSON(
          elements,
          { ...appState, viewBackgroundColor: realBackgroundRef.current },
          files,
          'database',
        ),
      ) as ExcalidrawInitialDataState
      saveBoard(boardId, payload).catch(() => {})
    }, SAVE_DEBOUNCE_MS)
  }

  if (!initialData) return null

  return (
    <div ref={containerRef} className={`board-canvas${dotGrid ? ' dot-grid' : ''}`}>
      <Excalidraw
        excalidrawAPI={(api) => {
          apiRef.current = api
        }}
        initialData={{
          ...initialData,
          appState: {
            ...initialData.appState,
            currentItemFontFamily: FONT_FAMILY.Helvetica,
            currentItemRoughness: 0,
            currentItemFillStyle: 'solid',
            viewBackgroundColor: dotGrid ? 'transparent' : initialData.appState?.viewBackgroundColor,
          },
        }}
        onChange={scheduleSave}
        onScrollChange={(scrollX, scrollY, zoom) => updateDotOffset(scrollX, scrollY, zoom.value)}
        renderTopRightUI={() => (
          <button
            type="button"
            className={`standalone dot-grid-toggle${dotGrid ? ' is-active' : ''}`}
            onClick={() => setDotGrid((v) => !v)}
            title="Dot grid background"
            aria-pressed={dotGrid}
          >
            <DotGridIcon />
          </button>
        )}
      >
        <WelcomeScreen>
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
              <span className="board-logo">Board</span>
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>A blank canvas for your ideas</WelcomeScreen.Center.Heading>
          </WelcomeScreen.Center>
        </WelcomeScreen>
        <MainMenu>
          <MainMenu.Item onSelect={onBack}>My boards</MainMenu.Item>
          <MainMenu.Separator />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.CommandPalette />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ClearCanvas />
        </MainMenu>
      </Excalidraw>
    </div>
  )
}

function DotGridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="3" cy="3" r="1.4" fill="currentColor" />
      <circle cx="8" cy="3" r="1.4" fill="currentColor" />
      <circle cx="13" cy="3" r="1.4" fill="currentColor" />
      <circle cx="3" cy="8" r="1.4" fill="currentColor" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <circle cx="13" cy="8" r="1.4" fill="currentColor" />
      <circle cx="3" cy="13" r="1.4" fill="currentColor" />
      <circle cx="8" cy="13" r="1.4" fill="currentColor" />
      <circle cx="13" cy="13" r="1.4" fill="currentColor" />
    </svg>
  )
}
