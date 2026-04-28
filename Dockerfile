# Stage 1: Build
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner

RUN npm install -g pnpm

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY docker/entrypoint.sh ./

EXPOSE 3000

CMD ["sh", "entrypoint.sh"]
