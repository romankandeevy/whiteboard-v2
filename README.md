# Board

A minimal, fast whiteboard app for sketching ideas. Sign in, create boards, and draw — everything autosaves to the cloud so you can pick up where you left off from any device.

Built on top of [Excalidraw](https://github.com/excalidraw/excalidraw) for the drawing canvas, with [Supabase](https://supabase.com) handling auth and per-user board storage. Sign-up uses Supabase's email confirmation (delivered through your own SMTP so it's reliable and needs no domain), plus **Google** one-click sign-in.

## Features

- **Email confirmation** — Supabase sends a confirmation link on sign-up; clicking it activates the account and signs you in. Delivered via custom SMTP (e.g. Gmail) so it doesn't rely on Supabase's rate-limited default mailer.
- **Google sign-in** — one-click OAuth.
- **A real board dashboard** — searchable grid, create-and-name flow, inline rename, per-board thumbnails, relative timestamps, and an empty state.
- **Autosave** — changes are debounced and saved to Postgres as you draw.
- **Per-user data isolation** — Postgres row-level security ensures users only ever see their own boards.
- **Dot-grid background toggle** on the canvas.
- **Routing** — each board has its own URL (`/whiteboard/:boardId`).

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev)
- [Excalidraw](https://github.com/excalidraw/excalidraw) for the canvas
- [Supabase](https://supabase.com) — Postgres, sessions, email confirmation, and Google OAuth
- [Framer Motion](https://www.framer.com/motion/) for animation, [React Router](https://reactrouter.com) for routing
- Design: the **Tech.corp** design system (`src/design-system/`) — cold white + charcoal + electric blue, **Rubik** display + **JetBrains Mono**
- Deployed on [Vercel](https://vercel.com)

## Getting started

### Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project
- An email account you can send SMTP through (Gmail works and needs no domain)
- A [Google Cloud](https://console.cloud.google.com) project (for Google sign-in)

### 1. Clone and install

```bash
git clone https://github.com/romankandeevy/whiteboard-v2.git
cd whiteboard-v2
npm install
```

### 2. Database

In the Supabase SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql). It creates the
`boards` table with row-level security so each user only sees their own boards.

### 3. Email delivery (custom SMTP)

Supabase's built-in mailer is rate-limited (~a couple of emails per hour) and not meant for real
sign-ups. Point Supabase at your own SMTP instead — with Gmail this takes ~5 minutes and needs no
domain:

1. On your Google account, enable **2-Step Verification**, then create an **App password**
   (Google Account → Security → App passwords). You'll get a 16-character password.
2. In Supabase: **Authentication → Emails → SMTP Settings → Enable custom SMTP**:
   - Host `smtp.gmail.com`, Port `465`
   - Username: your full Gmail address · Password: the app password
   - Sender email: your Gmail address · Sender name: `Board`
3. **Authentication → Providers → Email** → keep **Confirm email** ON.
4. **Authentication → URL Configuration** → add `http://localhost:5173` and your production origin
   to the redirect URLs.

Gmail sends to any recipient at ~500 emails/day — plenty for a small app.

### 4. Google sign-in

1. In **Google Cloud Console → Credentials**, create an **OAuth client ID** (Web application).
2. Add the redirect URI Supabase shows you under **Auth → Providers → Google**, typically
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
3. Paste the client ID + secret into Supabase's Google provider and enable it.

### 5. Environment variables

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
```

`.env` is gitignored. The publishable/anon key is safe to expose (RLS enforces access).

### 6. Run

```bash
npm run dev   # http://localhost:5173
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

## Deployment

Deploys on [Vercel](https://vercel.com) (see `vercel.json` for the SPA rewrite). Add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project settings, and make sure
your Vercel origin is listed in Supabase's Auth redirect URLs.

## Project structure

```
src/
  Auth.tsx         # Sign-in / sign-up + confirmation-sent screen + Google button
  BoardList.tsx    # Board dashboard (search, create, rename, delete)
  BoardView.tsx    # Lazy-loaded wrapper around the canvas
  Board.tsx        # Excalidraw canvas + autosave logic
  lib/
    supabase.ts    # Supabase client
    useAuth.ts     # Auth session hook
    auth.ts        # Google sign-in + resend-confirmation helpers
    boards.ts      # CRUD helpers for boards
supabase/
  schema.sql       # boards table + RLS policies
```
