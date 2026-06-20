# Board

A minimal, fast whiteboard app for sketching ideas. Sign in, create boards, and draw — everything autosaves to the cloud so you can pick up where you left off from any device.

Built on top of [Excalidraw](https://github.com/excalidraw/excalidraw) for the drawing canvas, with [Supabase](https://supabase.com) handling auth and per-user board storage.

## Features

- **Email/password auth** — sign up and sign in via Supabase Auth
- **Multiple boards** — create, open, and delete boards from a board list screen
- **Autosave** — changes are debounced and saved to Postgres as you draw
- **Per-user data isolation** — Postgres row-level security ensures users only ever see their own boards
- **Dot-grid background toggle** — switch between a solid background and a dot grid
- **Routing** — each board has its own URL (`/whiteboard/:boardId`) for easy sharing/bookmarking within your account

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev)
- [Excalidraw](https://github.com/excalidraw/excalidraw) for the canvas
- [Supabase](https://supabase.com) for auth + Postgres storage
- [React Router](https://reactrouter.com) for client-side routing
- [Framer Motion](https://www.framer.com/motion/) for the sign-in/sign-up screen animations
- Deployed on [Vercel](https://vercel.com)

## Getting started

### Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/romankandeevy/whiteboard-v2.git
cd whiteboard-v2
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the schema in [`supabase/schema.sql`](./supabase/schema.sql). It creates the `boards` table along with row-level security policies so each user can only access their own boards.
3. Grab your project URL and anon/publishable key from **Project Settings → API**.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your Supabase project values:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
```

`.env` is gitignored — never commit real keys. The Supabase anon/publishable key is safe to expose in client code by design (access is enforced by the row-level security policies in `schema.sql`), but it should still come from your own project, not be hardcoded or shared.

### 4. Run the dev server

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Deployment

The project is set up to deploy on [Vercel](https://vercel.com) (see `vercel.json` for the SPA rewrite rule). Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in your Vercel project settings before deploying.

## Project structure

```
src/
  Auth.tsx         # Sign-in / sign-up screen
  BoardList.tsx    # List of the current user's boards
  BoardView.tsx    # Lazy-loaded wrapper around the canvas
  Board.tsx        # Excalidraw canvas + autosave logic
  lib/
    supabase.ts    # Supabase client
    useAuth.ts     # Auth session hook
    boards.ts      # CRUD helpers for boards
supabase/
  schema.sql       # Database schema + RLS policies
```
