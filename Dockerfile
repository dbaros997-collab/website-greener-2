# Full-stack Grace High School — site + /dashboard + /api in one container.
# Coolify: Build Pack = Dockerfile. Set DATABASE_URL + SESSION_SECRET (+ PORT auto).

FROM node:20-bookworm AS builder
WORKDIR /app

ENV CI=true
ENV npm_config_update_notifier=false

COPY . .

RUN npm install -g pnpm \
  && node --version \
  && pnpm --version

RUN pnpm install --frozen-lockfile \
  --config.dangerouslyAllowAllBuilds=true \
  --filter @workspace/api-server... \
  --filter @workspace/grace-high-school... \
  --filter @workspace/grace-admin...

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1536"

RUN pnpm --filter @workspace/api-server run build \
  && pnpm --filter @workspace/grace-high-school run build \
  && pnpm --filter @workspace/grace-admin run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV ALLOWED_ORIGINS=https://gracehighschoolgayaza.academy,https://www.gracehighschoolgayaza.academy

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/scripts/package.json ./scripts/package.json
COPY --from=builder /app/scripts/src/setup-db.mjs ./scripts/src/setup-db.mjs
COPY --from=builder /app/scripts/src/docker-start.mjs ./scripts/src/docker-start.mjs
COPY --from=builder /app/artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/grace-high-school/dist ./artifacts/grace-high-school/dist
COPY --from=builder /app/artifacts/grace-admin/dist ./artifacts/grace-admin/dist

RUN chown -R node:node /app
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "./scripts/src/docker-start.mjs"]
