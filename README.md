# Zuryo — On-demand fitness booking MVP

Working MVP for the Zuryo founding full-stack assignment: customers book instant or scheduled 60-minute sessions with community trainers; trainers run sessions with a server-authoritative timer; admins view bookings and pricing.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas / local MongoDB + Mongoose |
| Auth | JWT (`customer` / `trainer` / `admin`) |
| AI | Rules-based personalized workout recommender (server-side) |
| Deploy target | Vercel (client) + Render (API) + MongoDB Atlas |

## Quick start (local)

### Prerequisites

- Node.js 18+
- MongoDB running locally **or** an Atlas connection string

### 1. API

```bash
cd server
cp .env.example .env   # edit MONGODB_URI if needed
npm install
npm run seed
npm run dev
```

API: `http://localhost:4000` · Health: `GET /health`

### 2. Web app

```bash
cd client
cp .env.local.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

### Demo logins

Password for all: `password123`

| Role | Email |
|---|---|
| Customer | `customer@zuryo.demo` |
| Trainer | `trainer@zuryo.demo` |
| Admin | `admin@zuryo.demo` |

## Tests

```bash
cd server
npm test
```

Covers pricing/commission, session timer derivation (55/60), and workout recommender.

## Implemented features

- Instant + scheduled booking with zone-based trainer assignment and preferred trainer
- Overlap prevention and clear no-trainer handling
- Configurable pricing (₹399 / ₹499) + 10% society commission; server-side totals
- Sandbox payment + package session deduction with idempotency keys
- Cancel restores package credit
- Server-authoritative session start / warn@55 / complete@60
- In-app notifications for assign / cancel / reschedule / timer events
- Fitness profile + session history
- Rules-based AI workout recommendation
- Customer / trainer / admin role UIs
- Polling for booking/notification updates

## Partially implemented / stubbed

- Payments: sandbox only (no real PSP)
- Notifications: DB + UI (not push/SMS)
- Realtime: HTTP polling (not WebSockets)
- Mongo transactions: application-level overlap check (document Atlas replica-set transactions for production)

## Proposed (documented, not built)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) §7: push notifications, live ETA, surge pricing, ratings, nutrition chatbot, React Native evolution.

## Deploy notes

1. Create MongoDB Atlas free cluster; set `MONGODB_URI`.
2. Deploy `server/` to Render/Railway: set `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` (Vercel URL), `PORT`.
3. Run seed once against Atlas (`MONGODB_URI=... npm run seed`).
4. Deploy `client/` to Vercel with `NEXT_PUBLIC_API_URL` = Render API URL.
5. Allow CORS via `CLIENT_ORIGIN`.

## What to build next

1. Real payment + invoice webhooks  
2. Push notifications + reminders  
3. Replica-set transactions for booking locks  
4. Live trainer location / ETA  

## License

Assignment demo — synthetic data only.
