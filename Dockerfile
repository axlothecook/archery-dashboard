# Archery club ADMIN DASHBOARD image (SvelteKit + adapter-node).
# Built by CI for linux/arm64 (the Pi) and pushed to GHCR; the Pi only pulls.
#
# adapter-node produces a self-contained Node server in /app/build, run with
# `node build`. Like the public site, this app reads PUBLIC_API_BASE_URL via
# $env/dynamic/public at RUNTIME (see src/lib/auth.ts) — nothing is baked at
# build time; the compose service sets it as an env var (same-origin /api). The
# reverse proxy routes the dashboard's top-level paths (/prijava, /nadzorna-ploca,
# /accept-invite, /reset-password, /zaboravljena-lozinka) here.

# ---- build stage ----
FROM node:24-slim AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime stage ----
FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# adapter-node listens on PORT (default 3000). The reverse proxy targets dashboard:3000.
ENV PORT=3000
EXPOSE 3000

# Only the built server + the production node_modules it needs.
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

CMD ["node", "build"]
