FROM node:22-alpine AS base

# ── Dependências (todas, incluindo dev — para build) ─────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

# ── Dependências de produção (sem dev — para runtime) ────────────────────────
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Vars NEXT_PUBLIC_* precisam estar presentes em build time — .env fica fora do
# contexto Docker (ver .dockerignore), então recebem via --build-arg.
ARG NEXT_PUBLIC_BASE_PATH=""
ARG NEXT_PUBLIC_SITE_URL=""
ARG NEXT_PUBLIC_SENTRY_DSN=""
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Compila o worker BullMQ (bundla código local, mantém pacotes npm externos)
RUN npx esbuild src/worker.ts --bundle --platform=node --format=cjs \
    --outfile=dist/worker.cjs --packages=external --tsconfig=tsconfig.json

# ── Runner (produção) ─────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# App Next.js (standalone)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Dependências de produção para o worker (sobrescreve subset do standalone)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Prisma Client gerado (prod-deps não roda prisma generate, então copia do builder)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Worker BullMQ compilado
COPY --from=builder --chown=nextjs:nodejs /app/dist/worker.cjs ./worker.cjs

# Prisma schema (para migrations em deploy)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
