# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY --link package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM base AS build

COPY --link --from=deps /app/node_modules ./node_modules
COPY --link . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --link --from=build /app/public ./public
COPY --link --from=build --chown=1001:1001 /app/.next/standalone ./
COPY --link --from=build --chown=1001:1001 /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
