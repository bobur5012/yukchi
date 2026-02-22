# Yukchi Backend

Production-ready logistics backend with NestJS API and Telegram GramJS Worker.

## Architecture

```
yukchi-backend/
├── api/          ← NestJS REST API (Railway service: api)
├── worker/       ← Telegram GramJS Worker (Railway service: telegram-worker)
├── docker-compose.yml
└── README.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| API Framework | NestJS 10 + TypeScript |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache / Queue | Redis 7 + BullMQ |
| Auth | JWT (access 15m + refresh 30d, httpOnly cookie) |
| Finance | Decimal.js (no float errors) |
| Telegram Bot | node-telegram-bot-api |
| Telegram Client | GramJS (telegram package) |
| Security | Helmet, CORS, Throttler, bcrypt, jti replay protection |
| Logger | Pino |
| Deploy | Railway + Docker |

---

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 20+

### 1. Clone and configure environment

```bash
cp api/.env.example api/.env
cp worker/.env.example worker/.env
```

Edit `api/.env` and `worker/.env` with your values.

### 2. Start all services

```bash
docker-compose up -d
```

### 3. Run migrations and seed

```bash
cd api
npm install
npx prisma migrate dev --name init
npm run seed
```

### 4. API is ready at

```
http://localhost:3000/api/v1
http://localhost:3000/api/docs  ← Swagger (dev only)
```

---

## Railway Deployment

### Services to create in Railway

| Service | Source | Always On |
|---|---|---|
| `api` | `api/` directory | ✅ |
| `telegram-worker` | `worker/` directory | ✅ |
| `PostgreSQL` | Railway Plugin | ✅ |
| `Redis` | Railway Plugin | ✅ |

### Step-by-step

#### 1. Create Railway project

```bash
railway init
```

#### 2. Add PostgreSQL and Redis plugins

In Railway dashboard → Add Plugin → PostgreSQL
In Railway dashboard → Add Plugin → Redis

#### 3. Create `api` service

```bash
cd api
railway up --service api
```

Set environment variables in Railway dashboard for the `api` service:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<from Railway PostgreSQL>
REDIS_URL=<from Railway Redis>
JWT_ACCESS_SECRET=<generate 256-bit secret>
JWT_REFRESH_SECRET=<generate 256-bit secret>
FRONTEND_URL=https://your-app.netlify.app
TELEGRAM_BOT_TOKEN=<your bot token>
TELEGRAM_GROUP_CHAT_ID=<group chat id>
TELEGRAM_APP_ID=<from my.telegram.org>
TELEGRAM_APP_HASH=<from my.telegram.org>
SESSION_ENCRYPTION_KEY=<32+ byte hex key>
```

#### 4. Run migrations on Railway

```bash
railway run --service api npm run migrate
railway run --service api npm run seed
```

#### 5. Create `telegram-worker` service

```bash
cd worker
railway up --service telegram-worker
```

Set environment variables for `telegram-worker`:

```
REDIS_URL=<from Railway Redis>
DATABASE_URL=<from Railway PostgreSQL>
TELEGRAM_APP_ID=<same as api>
TELEGRAM_APP_HASH=<same as api>
SESSION_ENCRYPTION_KEY=<same as api>
TELEGRAM_ENCRYPTED_SESSION=<encrypted session string>
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_RESET_TIMEOUT_MS=300000
```

### Generate secrets

```bash
# JWT secrets (run twice for access + refresh)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Session encryption key (AES-256)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## API Reference

Base URL: `https://your-api.railway.app/api/v1`

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Login with phone + password |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Current user |

### Trips

| Method | Endpoint | Description |
|---|---|---|
| GET | `/trips` | List trips (paginated) |
| POST | `/trips` | Create trip (fixes exchange rate) |
| GET | `/trips/:id` | Get trip detail |
| PATCH | `/trips/:id` | Update trip |
| DELETE | `/trips/:id` | Delete trip |

### Shops / Debts

| Method | Endpoint | Description |
|---|---|---|
| GET | `/shops` | List shops |
| GET | `/shops/debtors` | List debtors |
| POST | `/shops/:id/debt` | Add debt or payment |
| POST | `/notifications/debtors/notify` | Queue notifications to all debtors |

### Full Swagger docs available at `/api/docs` (dev mode only)

---

## Database Schema

15 tables:

```
users                  ← admins
couriers               ← delivery personnel (soft delete)
regions                ← 14 Uzbekistan regions
exchange_rates         ← currency pairs (USD base)
trips                  ← logistics trips (fixed exchange rate)
trip_couriers          ← many-to-many trips <> couriers
products               ← trip products with USD conversion
expenses               ← trip expenses with USD conversion
shops                  ← partner shops (soft delete)
shop_debt_entries      ← debt/payment history
refresh_tokens         ← JWT refresh token store (jti)
notification_log       ← notification delivery log
telegram_message_log   ← GramJS send log
audit_log              ← user action audit trail
security_log           ← security event log
```

---

## Security Checklist

- [x] bcrypt password hashing (saltRounds=12)
- [x] JWT access token 15 min expiry
- [x] Refresh token rotation (old token revoked on use)
- [x] jti blacklist in Redis (replay attack prevention)
- [x] httpOnly secure cookies for refresh token
- [x] Helmet security headers
- [x] CORS whitelist (Netlify URL only in production)
- [x] Rate limiting (10 auth requests / min, 200 global / min)
- [x] Input validation with class-validator (whitelist + forbidNonWhitelisted)
- [x] Audit log for all write operations
- [x] Security log for auth events
- [x] Prisma parameterized queries (SQL injection prevention)
- [x] AES-256-GCM encrypted Telegram session storage
- [x] Environment variable validation with Joi

---

## Financial Logic

- Exchange rate is **fixed** at trip creation time
- `budget_usd`, `cost_price_usd`, `amount_usd` are denormalized for historical accuracy
- Old trips are **never recalculated** when exchange rates change
- All amounts stored as `NUMERIC(18,2)` — no floating point errors
- `Decimal.js` used for all calculations in application layer

---

## Telegram Worker Circuit Breaker

The GramJS worker implements a circuit breaker pattern:

- **CLOSED** (normal): Messages sent normally
- **OPEN** (error state): After N failures, circuit opens, all jobs rejected
- **HALF_OPEN**: After reset timeout, one attempt allowed to test recovery

`PEER_FLOOD` immediately triggers circuit open to prevent Telegram account ban.
