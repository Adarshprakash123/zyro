# Zuryo — Technical architecture

## 1. Stack choice

- **Next.js** for a fast, deployable role-based UI on Vercel.
- **Express** as a single authoritative REST API (easy to test and explain in the tech discussion).
- **MongoDB + Mongoose** for flexible documents (bookings, sessions, profiles) and Atlas free-tier hosting.
- **JWT** for demo-friendly auth with role claims.
- **Rules-based recommender** so the AI feature works without paid LLM credentials; upgrade path to an LLM is documented below.

## 2. Data model & key APIs

### Collections

`User`, `TrainerProfile`, `PricingConfig`, `Package`, `Booking`, `Session`, `FitnessProfile`, `Notification`, `IdempotencyKey`

### Key endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/login` | Demo login |
| GET | `/bookings/slots` | Available slots + price preview |
| POST | `/bookings` | Create instant/scheduled booking |
| POST | `/bookings/:id/pay` | Sandbox pay + package deduct |
| POST | `/bookings/:id/cancel` | Cancel + restore credit |
| PATCH | `/bookings/:id/reschedule` | Reschedule |
| POST | `/sessions/:bookingId/start` | Authoritative start |
| GET | `/sessions/:id/status` | Timer status (55/60) |
| GET | `/packages/me` | Package balance |
| PUT | `/fitness/profile` | Assessment |
| POST | `/fitness/recommend` | AI recommendation |
| GET/PUT | `/admin/pricing` | Configurable pricing |
| GET | `/admin/bookings` | Ops view |

## 3. Trainer assignment

1. Filter active trainers whose `zones` include the customer `societyZone`.
2. Require availability window covering `[startAt, startAt+60m)`.
3. Exclude trainers with overlapping bookings in active statuses.
4. If `preferredTrainerId` is eligible → assign them.
5. Else sort by haversine distance to customer lat/lng, then fewest bookings that calendar day.

Simulated GPS coordinates are seeded. **Production:** continuous GPS via mobile SDK → location stream → ETA = routing API (Google/Mapbox) + traffic; show trainer pin + ETA on customer UI; geofence society polygon for zone membership.

## 4. Double booking & concurrency

MVP: re-check overlap immediately before insert; indexes on `{ trainerId, startAt, endAt }`.

**Production:** MongoDB multi-document transactions on a replica set, or a unique booking lock key `trainerId + slotStart`, or Redis redlock around assignment. Concurrent requests that lose the race receive `409`.

## 5. Session timers

- `Session.startedAt` is set only by `POST /sessions/:bookingId/start` on the server.
- Status is derived from server clock on every `GET .../status` (and polling): active → warning at 55m → completed at 60m.
- Browser refresh, app close, and skewed device clocks do not change authoritative times — the UI is display-only.
- Delayed notifications: reconcile-on-read writes `warnedAt` / `completedAt` and notifications when the client (or a future cron) polls.

## 6. Pricing & packages (secure)

- `PricingConfig` holds normal/peak prices, commission rate, peak hours/days.
- Checkout never trusts client totals; `calculatePriceBreakdown` runs on the server.
- Example normal: ₹399 + ₹39.90 = **₹438.90**; peak uses ₹499 base.
- Package deduction on sandbox pay uses `Idempotency-Key` so retries do not double-consume.
- Cancel restores one session credit (`refunded_credit`); true money refunds would call the PSP and keep an audit ledger.

## 7. Notifications, GPS, ETA (production)

- **Now:** `Notification` documents + UI badge/list; poll every 3–5s.
- **Production:** FCM/APNs for push; SMS via Twilio for critical assign/cancel; WebSockets/SSE for live dashboard; background location for trainers; Mapbox Directions for ETA; privacy: consent, retention policy, precise location only while en-route.

## 8. Auth, secrets, privacy

- JWT Bearer tokens; role middleware on routes.
- Secrets in env (`JWT_SECRET`, `MONGODB_URI`); never in client bundles except `NEXT_PUBLIC_API_URL`.
- Synthetic demo users only; no real PII.
- HTTPS in production; rotate JWT secret; short-lived tokens + refresh if scaled.

## 9. Scaling

- Stateless API replicas behind a load balancer.
- MongoDB Atlas indexes + sharding by `societyZone` if multi-city.
- Cache pricing config and slot availability briefly (Redis).
- Move assignment to a queue worker under burst load.
- CDN for Next.js static assets.

## 10. Cost estimate (MVP monthly, approx.)

| Item | Est. |
|---|---|
| Atlas M0 | $0 |
| Render free/starter API | $0–7 |
| Vercel hobby | $0 |
| Domain (optional) | ~$12/yr |
| LLM (if added later) | usage-based |

**Major drivers later:** SMS, maps/ETA API calls, managed DB, push infra. Trade-off: rules engine now = $0 AI cost and predictable latency; LLM later improves personalization at higher cost/latency.

## Assumptions & limitations

- Trainers available in seeded morning/evening windows; instant booking may fail outside those hours.
- Standalone local Mongo has no multi-doc transactions.
- One society zone in seed (`green-park`).
- No real payments or push.

---

## Additional feature proposals (§7)

### A. Live trainer location & arrival ETA

- **UX:** Customer sees map + ETA after assignment; trainer app streams location while `en_route`.
- **APIs:** `POST /locations` (trainer), `GET /bookings/:id/eta`.
- **Model:** `TrainerLocation { trainerId, lat, lng, updatedAt }`, booking field `etaSeconds`.
- **Deps:** Mapbox/Google, mobile background location.
- **Edges:** GPS spoofing, battery, offline, society geofence exit.

### B. Demand-based surge pricing

- **UX:** Show surge multiplier before pay; admin can cap max surge.
- **APIs:** extend `PricingConfig` with `surgeRules`; `GET /pricing/quote?startAt&zone`.
- **Model:** demand window counts open bookings / available trainers.
- **Edges:** quote expiry, fairness, transparency, regulatory disclosure.

### Preferred-trainer, ratings, nutrition chatbot, off-day recommendations

Architecture sketches: preferred trainer already partially implemented; ratings as `Review` collection post-session; nutrition chatbot as scoped LLM with server-held keys + allowlisted topics; off-day plans reuse `/fitness/recommend` on a cron with push.

### React Native evolution

Share API + auth; rebuild screens in RN with React Query; reuse assignment/timer logic unchanged on the server; add push notification device tokens.

---

## AI feature detail

**Implemented:** `POST /fitness/recommend` — rules engine (`recommenderService`) using profile level/goals/preferences and recent exercises.

**Future LLM:** server-only OpenAI/Gemini call; prompt = JSON profile + last 5 sessions; expect ~1–3s latency; cost ~$0.001–0.01/call depending on model; limitations = hallucination, need safety filters for medical advice.
