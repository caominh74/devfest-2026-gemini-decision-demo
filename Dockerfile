# syntax=docker/dockerfile:1

FROM oven/bun:1-slim AS base
WORKDIR /app

# 1. Install dependencies from bun.lock only
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# 2. Build the Next.js standalone bundle
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# 3. Minimal production runner
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

COPY --from=builder --chown=bun:bun /app/public ./public
COPY --from=builder --chown=bun:bun /app/.next/standalone ./
COPY --from=builder --chown=bun:bun /app/.next/static ./.next/static

USER bun

EXPOSE 8080

CMD ["bun", "server.js"]
