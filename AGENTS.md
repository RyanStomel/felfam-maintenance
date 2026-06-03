# AGENTS.md

## Cursor Cloud specific instructions

### Product

Single Next.js 16 app (`felfam-maintenance`): mobile-first maintenance tickets backed by remote Supabase (Postgres + Storage). No monorepo, Docker, or local Supabase CLI in this repo.

### Services

| Service | Required locally | Notes |
|--------|------------------|--------|
| Next.js (`npm run dev`) | Yes | `http://localhost:3000` |
| Supabase project `felfam-maintenance` | Yes | Schema in `supabase/schema.sql`; bucket `maintenance-files` for uploads |
| Telnyx | No | SMS skipped if `TELNYX_API_KEY` unset |

### Environment

Copy README env block into `.env.local` (gitignored). Minimum for dashboard/settings (anon client):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Also set `SUPABASE_SERVICE_ROLE_KEY` for server routes: `POST /api/requests`, work logs, request-detail status API, and SMS recipient queries. Without it, creating requests via `/requests/new` fails.

Optional: `APP_BASE_URL`, `TELNYX_API_KEY`, `TELNYX_MESSAGING_PROFILE_ID`.

### Commands (see `package.json`)

- Install: `npm install`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Build: `npm run build`
- Prod: `npm run start` (after build)

### Dev server

Use a named tmux session (e.g. `next-dev-server`) so the process survives backgrounding. The dashboard is a client component that loads data from Supabase in the browser; verify with filters or inline comments without needing the service role.

### Security note

The linked Supabase project may have RLS disabled on several public tables (anon can read/write). Do not enable RLS without policies unless intentional—see Supabase advisor output when using MCP.
