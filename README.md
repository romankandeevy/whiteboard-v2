# Board

A minimal, fast whiteboard app for sketching ideas. Sign in, create boards, and draw — everything autosaves to the cloud so you can pick up where you left off from any device.

Built on top of [Excalidraw](https://github.com/excalidraw/excalidraw) for the drawing canvas, with [Supabase](https://supabase.com) for storage and sessions. Email sign-up uses a **custom 6-digit code flow** delivered through [Resend](https://resend.com) (not Supabase's built-in mailer), plus **Google** one-click sign-in.

## Features

- **Custom email verification** — sign-up sends a 6-digit code from our own edge function via Resend, then confirms the account. No waiting on Supabase's rate-limited built-in email.
- **Google sign-in** — one-click OAuth.
- **A real board dashboard** — searchable grid, create-and-name flow, inline rename, per-board thumbnails, relative timestamps, and an empty state.
- **Autosave** — changes are debounced and saved to Postgres as you draw.
- **Per-user data isolation** — Postgres row-level security ensures users only ever see their own boards.
- **Dot-grid background toggle** on the canvas.
- **Routing** — each board has its own URL (`/whiteboard/:boardId`).

## Tech stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vite.dev)
- [Excalidraw](https://github.com/excalidraw/excalidraw) for the canvas
- [Supabase](https://supabase.com) — Postgres, sessions, Google OAuth, and Edge Functions
- [Resend](https://resend.com) for transactional email
- [Framer Motion](https://www.framer.com/motion/) for animation, [React Router](https://reactrouter.com) for routing
- Fonts: **Fraunces** (display) + **Hanken Grotesk** (body)
- Deployed on [Vercel](https://vercel.com)

## How email sign-up works

```
Sign up (email + password)
  └─ POST /functions/v1/auth-signup   ── creates an UNCONFIRMED user, stores a
                                          hashed 6-digit code, emails it via Resend
Enter code
  └─ POST /functions/v1/auth-verify   ── checks the code, marks the email confirmed
  └─ signInWithPassword               ── logs you in
```

Codes live in the `email_verifications` table (10-minute expiry, max 5 attempts, 45-second
resend cooldown). The table is locked down with RLS — only the edge functions (service role)
can touch it. Because accounts are created **unconfirmed**, keep **“Confirm email” ON** in
Supabase Auth so nobody can bypass the code by signing in directly.

## Getting started

### Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) project
- A free [Resend](https://resend.com) account (for verification emails)
- A [Google Cloud](https://console.cloud.google.com) project (for Google sign-in)

### 1. Clone and install

```bash
git clone https://github.com/romankandeevy/whiteboard-v2.git
cd whiteboard-v2
npm install
```

### 2. Database

In the Supabase SQL editor, run [`supabase/schema.sql`](./supabase/schema.sql) (boards table + RLS)
and [`supabase/verification.sql`](./supabase/verification.sql) (the `email_verifications` table and
the `auth_user_status` lookup function).

### 3. Edge Functions

Deploy the two auth functions and give them a Resend key:

```bash
supabase functions deploy auth-signup --no-verify-jwt
supabase functions deploy auth-verify --no-verify-jwt
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
# optional — defaults to "Board <onboarding@resend.dev>"
supabase secrets set VERIFY_EMAIL_FROM="Board <hello@yourdomain.com>"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — you don't set those.

> **Resend note:** with no verified domain, Resend only delivers to the address that owns the
> Resend account (fine for testing). To email anyone, verify a domain in Resend and point
> `VERIFY_EMAIL_FROM` at it.

### 4. Google sign-in

1. In **Google Cloud Console → Credentials**, create an **OAuth client ID** (Web application).
2. Add the redirect URI Supabase shows you (**Auth → Providers → Google**), typically
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
3. Paste the client ID + secret into Supabase’s Google provider and enable it.
4. In **Auth → URL Configuration**, add your redirect URLs: `http://localhost:5173` and your
   production origin.

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
your Vercel origin is listed in Supabase’s Auth redirect URLs.

## Project structure

```
src/
  Auth.tsx         # Sign-in / sign-up + 6-digit code step + Google button
  CodeInput.tsx    # 6-digit one-time-code input
  BoardList.tsx    # Board dashboard (search, create, rename, delete)
  BoardView.tsx    # Lazy-loaded wrapper around the canvas
  Board.tsx        # Excalidraw canvas + autosave logic
  lib/
    supabase.ts    # Supabase client
    useAuth.ts     # Auth session hook
    auth.ts        # Custom sign-up / verify / Google helpers
    boards.ts      # CRUD helpers for boards
supabase/
  schema.sql       # boards table + RLS policies
  verification.sql # email_verifications table + auth_user_status()
  functions/
    auth-signup/   # create unconfirmed user + email a code
    auth-verify/   # check code + confirm email
```
