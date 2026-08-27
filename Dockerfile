# Full-stack Grace High School — site + /dashboard + /api in one container.
# Coolify: Build Pack = Dockerfile. Set DATABASE_URL + SESSION_SECRET (+ PORT auto).

FROM node:20-bookworm AS builder
WORKDIR /app

ENV CI=true
ENV PNPM_HOME=/pnpm
ENV PATH="/pnpm:${PATH}"
ENV npm_config_update_notifier=false

# Install pnpm for the host CPU (Coolify servers may be amd64 or arm64).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates wget \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /pnpm \
  && arch="$(uname -m)" \
  && case "$arch" in \
    x86_64) pnpm_arch="linux-x64" ;; \
    aarch64|arm64) pnpm_arch="linux-arm64" ;; \
    *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; \
  esac \
  && wget -qO /pnpm/pnpm "https://github.com/pnpm/pnpm/releases/download/v11.10.0/pnpm-${pnpm_arch}" \
  && chmod +x /pnpm/pnpm \
  && node --version \
  && /pnpm/pnpm --version

COPY . .

RUN echo ">>> Installing dependencies..." \
  && pnpm install --frozen-lockfile \
    --filter @workspace/api-server... \
    --filter @workspace/grace-high-school... \
    --filter @workspace/grace-admin... \
  && echo ">>> Verifying esbuild..." \
  && node ./node_modules/esbuild/bin/esbuild --version

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1536"

RUN echo ">>> Building api-server..." \
  && pnpm --filter @workspace/api-server run build \
  && echo ">>> Building grace-high-school..." \
  && pnpm --filter @workspace/grace-high-school run build \
  && echo ">>> Building grace-admin..." \
  && pnpm --filter @workspace/grace-admin run build \
  && echo ">>> All builds finished."

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
