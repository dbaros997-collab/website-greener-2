# Coolify: set the build pack to Dockerfile so deploys skip the Nix builder.
FROM node:20-bookworm-slim

ENV CI=true \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_PRODUCTION=false \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NODE_ENV=development

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

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

RUN pnpm run install:docker

COPY . .

RUN pnpm run build:docker

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "./scripts/src/docker-start.mjs"]
