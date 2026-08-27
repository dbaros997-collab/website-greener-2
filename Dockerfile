# Full-stack Grace High School — public site, /dashboard admin, and /api on one service.
# Coolify: use this Dockerfile, set DATABASE_URL + SESSION_SECRET, map your custom domain.
# Force amd64 so esbuild/tailwind native binaries match on mixed-arch Coolify hosts.

FROM --platform=linux/amd64 node:20-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY artifacts/admin/package.json ./artifacts/admin/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/grace-admin/package.json ./artifacts/grace-admin/
COPY artifacts/grace-high-school/package.json ./artifacts/grace-high-school/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY scripts/package.json ./scripts/

RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY attached_assets ./attached_assets
COPY artifacts ./artifacts
COPY lib ./lib
COPY scripts ./scripts
COPY tsconfig.json tsconfig.base.json ./

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Skip typecheck and build sequentially to reduce peak memory on small Coolify servers.
RUN pnpm run build:docker

FROM --platform=linux/amd64 node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV ALLOWED_ORIGINS=https://gracehighschoolgayaza.academy,https://www.gracehighschoolgayaza.academy

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=build /app/artifacts/grace-high-school/dist ./artifacts/grace-high-school/dist
COPY --from=build /app/artifacts/grace-admin/dist ./artifacts/grace-admin/dist
COPY --from=build /app/scripts/src/setup-db.mjs ./scripts/src/setup-db.mjs

RUN chown -R node:node /app

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/healthz').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["sh", "-c", "node ./scripts/src/setup-db.mjs && exec node --enable-source-maps ./artifacts/api-server/dist/index.mjs"]
