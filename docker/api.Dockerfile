FROM node:26-bookworm-slim AS base
WORKDIR /app
RUN npm install -g corepack@latest --force && corepack enable

FROM base AS build
ENV NODE_OPTIONS=--max-old-space-size=1536
ENV YARN_NETWORK_CONCURRENCY=2
ENV YARN_ENABLE_GLOBAL_CACHE=false
# Compose servis adları (redis/postgres) build ağında çözülmez.
ENV DOCKER_BUILD=1
ENV REDIS_URL=redis://127.0.0.1:6379
ENV DATABASE_HOST=127.0.0.1

COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/patches ./.yarn/patches
COPY api ./api
COPY frontend/package.json ./frontend/
COPY admin/package.json ./admin/
RUN yarn workspaces focus @kilic/api
WORKDIR /app/api
RUN yarn build

FROM node:26-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Puppeteer PDF (e-Arşiv e-posta eki)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY --from=build /app/package.json /app/yarn.lock /app/.yarnrc.yml ./
COPY --from=build /app/api/package.json ./api/package.json
COPY --from=build /app/api/dist ./api/dist
COPY --from=build /app/node_modules ./node_modules
WORKDIR /app/api
EXPOSE 4000
CMD ["node", "dist/main.js"]
