# syntax=docker/dockerfile:1
# Coolify: Build strategy = Dockerfile.
# npm ci uses registry.npmjs.org with a small socket pool so package downloads
# do not stall the way pnpm's parallel fetches did.
FROM node:22-bookworm-slim

ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_PRODUCTION=false \
    NODE_ENV=development \
    ALLOW_NPM=1 \
    npm_config_registry=https://registry.npmjs.org \
    npm_config_fetch_retries=5 \
    npm_config_fetch_retry_factor=2 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=300000 \
    npm_config_maxsockets=2 \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

WORKDIR /app

# Manifests and the npm lockfile only. Dependency layers stay cached until one of these changes.
# The repo .npmrc is intentionally not copied here: it carries pnpm settings. npm ci gets
# registry.npmjs.org and a low maxsockets from the file written below.
COPY package.json package-lock.json pnpm-workspace.yaml ./
COPY scripts/materialize-npm-manifests.mjs scripts/materialize-npm-manifests.mjs
COPY scripts/preinstall-guard.mjs scripts/preinstall-guard.mjs
COPY artifacts/api-server/package.json artifacts/api-server/package.json
COPY artifacts/grace-high-school/package.json artifacts/grace-high-school/package.json
COPY artifacts/grace-admin/package.json artifacts/grace-admin/package.json
COPY lib/api-client-react/package.json lib/api-client-react/package.json
COPY lib/api-zod/package.json lib/api-zod/package.json
COPY lib/db/package.json lib/db/package.json

RUN printf '%s\n' \
      'registry=https://registry.npmjs.org' \
      'fetch-retries=5' \
      'fetch-retry-factor=2' \
      'fetch-retry-mintimeout=20000' \
      'fetch-retry-maxtimeout=120000' \
      'fetch-timeout=300000' \
      'maxsockets=2' \
      'legacy-peer-deps=true' \
      'audit=false' \
      'fund=false' \
      > .npmrc \
 && node scripts/materialize-npm-manifests.mjs \
 && npm ci --no-audit --no-fund --legacy-peer-deps

COPY . .

# Vite inlines VITE_* during `vite build`. Coolify must mark this Available at Buildtime
# when the dashboard feed is not on the public site origin. Empty is ignored by the app.
ARG VITE_ADMIN_CONTENT_URL=https://gracehighschoolgayaza.academy/api/public/content?raw=1
ENV VITE_ADMIN_CONTENT_URL=${VITE_ADMIN_CONTENT_URL}

RUN npm --prefix artifacts/api-server run build \
 && npm --prefix artifacts/grace-high-school run build \
 && npm --prefix artifacts/grace-admin run build

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "./scripts/src/docker-start.mjs"]
