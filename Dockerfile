# syntax=docker/dockerfile:1.7

# ---------- deps ----------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci \
 && npm install --no-save --no-audit --no-fund \
      --os=linux --cpu=x64 --libc=musl \
      @next/swc-linux-x64-musl@"$(node -p "require('next/package.json').version")"

# ---------- builder ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- sharp (isolated install for runtime native binary) ----------
FROM node:22-alpine AS sharp
RUN apk add --no-cache libc6-compat
WORKDIR /sharp
RUN npm init -y >/dev/null \
 && npm install --no-save --no-audit --no-fund --omit=optional \
      --os=linux --cpu=x64 --libc=musl \
      sharp@0.34.5 \
 && rm -rf node_modules/@img/sharp-libvips-linux-x64 \
           node_modules/@img/sharp-linux-x64 \
           /root/.npm

# ---------- runner ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/messages ./messages
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=sharp --chown=nextjs:nodejs /sharp/node_modules/sharp ./node_modules/sharp
COPY --from=sharp --chown=nextjs:nodejs /sharp/node_modules/@img ./node_modules/@img

USER nextjs
EXPOSE 5000
CMD ["node", "server.js"]
