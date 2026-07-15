FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable

FROM base AS build
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
COPY frontend ./frontend
COPY api/package.json ./api/
COPY admin/package.json ./admin/
ARG NEXT_PUBLIC_API_URL=https://api.kiliccoffeeroasters.com.tr
ARG NEXT_PUBLIC_SITE_URL=https://kiliccoffeeroasters.com.tr
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN yarn install --immutable
WORKDIR /app/frontend
RUN yarn build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/frontend/public ./frontend/public
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static ./frontend/.next/static
EXPOSE 3000
CMD ["node", "frontend/server.js"]
