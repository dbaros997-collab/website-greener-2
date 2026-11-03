# syntax=docker/dockerfile:1
# Coolify: Build strategy = Dockerfile. pnpm 11 needs Node >= 22.13 (node:sqlite).
FROM node:22-bookworm-slim

ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_PRODUCTION=false \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NODE_ENV=development \
    npm_config_store_dir=/pnpm/store

WORKDIR /app

# Activate the pinned pnpm before any pnpm command. Node 20.20 has no node:sqlite.
RUN corepack enable \
 && corepack prepare pnpm@11.10.0 --activate \
 && pnpm --version

# Manifests only, so this dependency layer stays cached until a package.json or the lockfile changes.
# .npmrc is included here so pnpm install uses the registry mirror before any package download.
# Every workspace manifest stays in the image so the lockfile still matches; install below is filtered.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY artifacts/api-server/package.json artifacts/api-server/package.json
COPY artifacts/grace-high-school/package.json artifacts/grace-high-school/package.json
COPY artifacts/grace-admin/package.json artifacts/grace-admin/package.json
COPY artifacts/admin/package.json artifacts/admin/package.json
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json
COPY lib/api-spec/package.json lib/api-spec/package.json
COPY lib/api-zod/package.json lib/api-zod/package.json
COPY lib/db/package.json lib/db/package.json
COPY scripts/package.json scripts/package.json

# Deployed apps plus their workspace dependencies only.
# Skips admin, mockup-sandbox, api-spec, and scripts (scripts pulls embedded-postgres).
# --no-frozen-lockfile: this repo's lockfile settings differ from pnpm-workspace.yaml.
# Prefer the store, and fetch anything still missing. The mount reuses unchanged
# packages; Docker reuses this whole layer until a manifest or the lockfile changes.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --no-frozen-lockfile --prefer-offline \
      --filter @workspace/api-server... \
      --filter @workspace/grace-high-school... \
      --filter @workspace/grace-admin... \
      --store-dir /pnpm/store \
      --network-concurrency 2 \
      --fetch-retries 5 \
      --fetch-retry-factor 2 \
      --fetch-retry-mintimeout 10000 \
      --fetch-retry-maxtimeout 120000 \
      --fetch-timeout 120000

COPY . .

RUN pnpm run build:docker

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "./scripts/src/docker-start.mjs"]
