# syntax=docker/dockerfile:1.7

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies against lockfile for a reproducible build.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build for production.
COPY . .
# VITE_* env vars must be provided at build time (Vite inlines them).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_PROJECT_ID
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID
RUN npm run build

# ─── Runtime stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# TanStack Start emits a Nitro server bundle under .output/.
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Non-root user.
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000
ENV PORT=3000 HOST=0.0.0.0

# The Nitro server entry lives at .output/server/index.mjs.
CMD ["node", ".output/server/index.mjs"]
