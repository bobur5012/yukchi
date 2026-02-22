# Yukchi

Monorepo for the Yukchi logistics management application.

## Project layout

```
Yukchi/
├── frontend/           # Next.js web app
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env.example
│   └── next.config.ts
├── yukchi-backend/     # NestJS API + Telegram worker
│   ├── api/            # REST API
│   ├── worker/         # Telegram GramJS worker
│   ├── docker-compose.yml
│   └── RAILWAY_DEPLOY.md
└── README.md
```

## Quick start

### Backend (API + worker)

```bash
cd yukchi-backend
docker-compose up -d
cd api && npm install && npx prisma migrate dev && npm run seed
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
npm run dev
```

## Deployment

- **Backend**: See [yukchi-backend/RAILWAY_DEPLOY.md](yukchi-backend/RAILWAY_DEPLOY.md) for Railway deployment.
- **Frontend**: Deploy to Netlify or Vercel; set `NEXT_PUBLIC_API_URL` to your API base URL (e.g. `https://your-api.up.railway.app/api/v1`).
