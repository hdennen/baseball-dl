# -- Builder stage --
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/dal/package.json packages/dal/
COPY packages/api/package.json packages/api/

RUN npm ci

COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/dal/ packages/dal/
COPY packages/api/ packages/api/

RUN npm run build --workspace=@baseball-dl/shared && \
    npm run build --workspace=@baseball-dl/dal && \
    npm run build --workspace=@baseball-dl/api

# -- Production stage --
FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/dal/package.json packages/dal/
COPY packages/api/package.json packages/api/

RUN npm ci --omit=dev

COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/dal/dist packages/dal/dist
COPY --from=builder /app/packages/api/dist packages/api/dist

EXPOSE 8080
ENV PORT=8080
CMD ["node", "packages/api/dist/index.js"]
