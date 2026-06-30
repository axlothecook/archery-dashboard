# archery-dashboard

Admin dashboard for the VSK archery club — a **separate** SvelteKit app from the
public site ([Archery-club-front-end](https://github.com/axlothecook/Archery-club-front-end)),
but deployed **behind the same origin** as the public site so the session cookie
stays first-party.

It contains the staff-only area: `/prijava` (login) and `/nadzorna-ploca/*` (the dashboard
+ per-entity editors). It talks to the same Express/Prisma backend
([Archery-club-backend](https://github.com/axlothecook/Archery-club-backend)) as
the public site, under `/api`.

## ⚠️ Why "separate repo, SAME origin" (the critical constraint)

Auth is a **session cookie** (`__Host-session`, `HttpOnly; Secure; SameSite=Lax`,
host-only). For login to work on **both phone and laptop**, the dashboard and the
API must be **same-site** to the browser. A split *origin* (e.g.
`dashboard.example.com` → `api.example.com`) is cross-site, forces
`SameSite=None`, and is then dropped/partitioned by Safari ITP / Firefox Total
Cookie Protection / Brave — the classic "works on PC, fails on phone" bug.

So this is a separate **repo**, not a separate **origin**: in production a single
reverse proxy (nginx/Cloudflare) serves everything under one hostname —

```
archery.axlothecook.com/           → public site  (Archery-club-front-end, :3000)
archery.axlothecook.com/prijava    → THIS app      (archery-dashboard, :3001)
archery.axlothecook.com/nadzorna-ploca/*    → THIS app      (archery-dashboard, :3001)
archery.axlothecook.com/api/*      → backend        (Archery-club-backend, :3100, /api stripped)
```

The session cookie is first-party on the one origin → never dropped, on any
browser or device. (Verified research; see the project memory note
`archery-dashboard-auth-topology-research-2026-06-30`.)

### Example prod nginx (sketch — final config lives in the deploy repo)

```nginx
location /api/   { proxy_pass http://backend:3100/; }          # trailing slash strips /api
location /prijava { proxy_pass http://dashboard:3001; }
location /nadzorna-ploca/ { proxy_pass http://dashboard:3001; }
location /        { proxy_pass http://frontend:3000; }          # public site
```

The dashboard's `PUBLIC_API_BASE_URL` in prod must be the **absolute same-origin**
API: `https://archery.axlothecook.com/api` (it's read at runtime by `src/lib/auth.ts`).

## Local development

The dashboard runs on its own Vite port (5174 if the public site holds 5173), so
in dev it would be cross-origin to the backend — which breaks the cookie. The
`vite.config.ts` `server.proxy` fixes this by serving `/api` on the dashboard's
own origin and forwarding to the backend on `:3100`. So `PUBLIC_API_BASE_URL`
points at the **same-origin** `/api` path, mirroring prod.

```bash
# 1. start the backend (separate repo) on :3100
#    (Archery-club-backend) npm run dev
# 2. start the dashboard
npm install
npm run dev            # http://localhost:5174  (use --host for phone testing)
```

`.env.local` (gitignored) sets `PUBLIC_API_BASE_URL=http://localhost:5174/api`.
For **phone** testing on the LAN, change it to
`http://192.168.50.112:5174/api` (the proxy binds to all hosts via
`server.host: true`).

Local admin login lives as a row in the backend's Postgres `Admin` table (created
via the backend's `scripts/create-admin.ts`), **not** in any `.env`.

## Stack

SvelteKit 2 + Svelte 5 (runes) + adapter-node + TypeScript + scoped Sass, reusing
[`axlothecook-sass-library`](https://github.com/axlothecook/axlothecook-sass-library)
(library-first styling). Icons are reusable components in
`src/lib/components/icons/` (currentColor + size).

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build (adapter-node → `build/`)
- `npm run check` — svelte-check (types + templates)
- `npm run format` — prettier
