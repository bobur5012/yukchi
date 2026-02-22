# Railway Deployment Guide

Step-by-step instructions for deploying the Yukchi backend (API + Telegram Worker) to Railway.

## Prerequisites

- Railway account at [railway.app](https://railway.app)
- Railway CLI: `npm install -g @railway/cli`
- Run `railway login`

## Step 1 — Create project

```bash
cd yukchi-backend
railway init
# Select "Empty project", name it "yukchi"
```

## Step 2 — Add database and cache

In Railway dashboard → your project → **+ New** → **Database** → **PostgreSQL**

In Railway dashboard → your project → **+ New** → **Database** → **Redis**

Copy connection strings from the Railway dashboard for each service.

## Step 3 — Deploy API service

From `yukchi-backend` directory:

```bash
railway service create --name api
cd api
railway up -s api -d
```

The `api/` folder contains a Dockerfile (node:20-slim + openssl) and Prisma `binaryTargets = ["debian-openssl-3.0.x"]` — required for Railway.

Set environment variables (Railway dashboard → api service → Variables):

```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_REFRESH_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=https://your-app.netlify.app
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_GROUP_CHAT_ID=-1001234567890
TELEGRAM_APP_ID=your_app_id
TELEGRAM_APP_HASH=your_app_hash
SESSION_ENCRYPTION_KEY=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

Replace placeholder values with your actual secrets. Use Railway's variable references (`${{Postgres.DATABASE_URL}}`) for linked services.

## Step 4 — Run migrations and seed

From the `yukchi-backend` directory, link to the api service and run:

```bash
railway link
# Select the api service
railway run --service api npx prisma migrate deploy
railway run --service api npm run seed
```

If the working directory is not the api folder, run from within api:

```bash
cd api
railway link
railway run npx prisma migrate deploy
railway run npm run seed
```

## Step 5 — Deploy Telegram Worker

```bash
railway service create --name telegram-worker
railway up --service telegram-worker --source ./worker
```

Set variables for the worker (Railway dashboard → telegram-worker service → Variables):

```
REDIS_URL=${{Redis.REDIS_URL}}
DATABASE_URL=${{Postgres.DATABASE_URL}}
TELEGRAM_APP_ID=<same as api>
TELEGRAM_APP_HASH=<same as api>
SESSION_ENCRYPTION_KEY=<same as api>
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT_MS=300000
```

## Step 6 — Configure start commands

When using the Dockerfile (api), the start command is in the Dockerfile. If using buildpacks instead:

- **api**: `node dist/src/main.js`
- **telegram-worker**: `node dist/main.js`

## Step 7 — Deploy Frontend to Netlify

```bash
cd ../frontend
# Set env var in Netlify dashboard:
# NEXT_PUBLIC_API_URL = https://your-api.up.railway.app/api/v1
netlify deploy --prod
```

Use your Railway API public URL (e.g. `https://api-production-c4a4.up.railway.app`) and append `/api/v1` for the API base. Health check: `GET /api/health`.
