# Feature matrix

## Implemented

- Demo JWT auth with customer / trainer / admin roles
- Instant and scheduled booking
- Slot listing with price preview
- Zone-based auto assignment + preferred trainer
- Overlap prevention + no-trainer handling
- Configurable pricing + society commission (server-side)
- Sandbox checkout with package deduction + idempotency
- Cancel restores package credit
- In-app notifications (assign / cancel / reschedule / timer)
- Server-authoritative 60-minute session timer (warn @55, complete @60)
- Fitness profile and session history
- Rules-based personalized workout recommendation
- Customer, trainer, and admin UIs
- Automated tests for pricing, timer, recommender, package idempotency
- README + architecture document

## Partial / stubbed

- Payments (sandbox only)
- Notifications (in-app DB records, not push)
- Live updates (polling)
- Mongo multi-document transactions (app-level overlap check)

## Proposed (design only)

- Push notifications / reminders / offers
- Live trainer GPS + ETA
- Demand/surge pricing
- Ratings & feedback loops
- Off-day workout recommendations via push
- Nutrition chatbot
- React Native client
