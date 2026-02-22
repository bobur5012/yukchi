# Attempt 1: Prisma Docker best practice - node:slim + openssl
# See https://www.prisma.io/docs/guides/docker
FROM node:20-slim AS builder

WORKDIR /app

# OpenSSL required for Prisma on Debian
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner

# dumb-init + openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends dumb-init openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
