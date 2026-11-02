# Coolify: Build strategy = Dockerfile. pnpm 11 needs Node >= 22.13 (node:sqlite).
FROM node:22-bookworm-slim

ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_PRODUCTION=false \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NODE_ENV=development

WORKDIR /app

# Activate the pinned pnpm before any pnpm command. Node 20.20 has no node:sqlite.
RUN corepack enable \
 && corepack prepare pnpm@11.10.0 --activate \
 && pnpm --version

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

# Install from the lockfile at the workspace root.
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build:docker

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "./scripts/src/docker-start.mjs"]
