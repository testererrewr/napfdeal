# syntax=docker/dockerfile:1
# Multi-target image: `--target web` (Next.js) and `--target worker` (pg-boss jobs + migrations).
# Built by GitHub Actions, pulled by the server. Nothing is compiled on the VPS.

ARG NODE_IMAGE=node:22-bookworm-slim

# ---- all dependencies (for building) ---------------------------------------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---- build ------------------------------------------------------------------
FROM deps AS build
ARG NEXT_PUBLIC_SITE_URL=https://napfdeal.com
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build && npm run build:worker

# ---- production dependencies only (for the worker) --------------------------
FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# ---- web --------------------------------------------------------------------
FROM ${NODE_IMAGE} AS web
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]

# ---- worker -----------------------------------------------------------------
FROM ${NODE_IMAGE} AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist/worker ./dist/worker
COPY --from=build --chown=node:node /app/drizzle ./drizzle
COPY --from=build --chown=node:node /app/fixtures ./fixtures
COPY --chown=node:node package.json ./
USER node
CMD ["node", "dist/worker/index.mjs"]
