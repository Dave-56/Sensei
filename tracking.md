# ConvoSensei – Product Tracking Plan (MVP ➜ Prod)

This document tracks the concrete steps from the current codebase to a production‑ready MVP. Each item lists scope, acceptance criteria, and dependencies. Use it as the single checklist for PM + eng alignment.

## Milestones

- M0 – Database ready (Done)
- M1 – Auth + DB runtime wiring
- M2 – Read APIs (dashboard) – DB‑backed
- M3 – Settings + API Keys – DB‑backed
- M4A – SDK (client library)
- M4B – Ingestion API (track conversations)
- M5 – Worker Pipeline (Queue + processing)
- M6 – Alerts (Slack) – optional for MVP
- M7 – Frontend switch to live data
- M8 – Testing, hardening, and deploy

## M0 – Database Ready (Done)

- Status: Done
- Scope:
  - Drizzle config and schema aligned; migrations applied to Supabase
  - `messages.sentiment_score` type aligned to double precision
  - Composite PK not‑null fix on `pattern_conversations`
- Acceptance:
  - All tables exist in Supabase: conversations, messages, failures, usage_patterns, pattern_conversations, conversation_embeddings, api_keys, app_settings, saved_views
  - User scaffolding present for later (user_profiles, user_sessions, user_security_logs) but not required for MVP
  - `npm run db:up` succeeds on a clean environment

## M1 – Auth + DB Runtime Wiring

- Status: Not started
- Scope:
  - Implement Supabase JWT verification in middleware using `SUPABASE_JWT_SECRET` (or JWKS)
  - Add Drizzle runtime client: `server/db/client.ts` (pg pool + drizzle-orm/node-postgres)
  - Shared error util: map DB errors to `{ message, code? }`
- Acceptance:
  - All “Bearer” requests with a valid Supabase token pass; invalid are 401
  - A sample route can query the DB via `db` without crashing
- Dependencies: M0

## M2 – Read APIs (Dashboard) – DB‑Backed

- Status: Not started
- Scope (port from mock to DB):
  - GET `/api/v1/conversations` (filters: timeframe, health range, has_failures; pagination)
  - GET `/api/v1/conversations/:id/messages`
  - GET `/api/v1/conversations/:id/health` (basic breakdown for UI)
  - GET `/api/v1/conversations/:id/failures`
  - GET `/api/v1/analytics/summary`
  - GET `/api/v1/analytics/patterns` (top patterns; basic counts)
  - GET `/api/v1/analytics/failures/trends` (bucket/day)
- Acceptance:
  - Each endpoint returns data from Supabase tables (no mock)
  - Basic input validation (zod) and consistent error envelope
  - P95 ≤ 200ms locally for read endpoints
- Dependencies: M1

## Write APIs (Dashboard/Admin)

- Status: Not started
- Scope (all use Bearer auth; validate with zod):
  - Failures: `PATCH /api/v1/failures/:id` { status: 'open'|'ack'|'resolved' }
  - Saved Views: `POST /api/v1/saved-views` { name, scope, config }, `PUT /api/v1/saved-views/:id`, `DELETE /api/v1/saved-views/:id`
  - Settings: `PUT /api/v1/settings` { slack_webhook_url?, alert_thresholds? }
  - API Keys: `POST /api/v1/api-keys` (generate prefix+secret, store key_hash), `DELETE /api/v1/api-keys/:id`
  - Notes: enforce single-row invariant for `app_settings` (id=1), hash secrets at rest, update `last_used_at` on use
- Acceptance:
  - Writes persist to Supabase DB; invalid payloads return 400 with details
  - Idempotent updates where applicable (settings/saved views)
- Dependencies: M1 (DB client + auth), M3 (for API key hashing helper)

## M3 – Settings + API Keys – DB‑Backed

- Status: Not started
- Scope:
  - GET/PUT `/api/v1/settings` -> `app_settings`
  - GET/POST/DELETE `/api/v1/api-keys` -> `api_keys`
  - Key creation: generate prefix+secret, store `key_hash` (bcrypt/scrypt/argon2), never store plaintext
  - Update `last_used_at` when a key authenticates ingestion
- Acceptance:
  - Creating a key returns one‑time secret; listing shows only metadata
  - Revoking removes/marks key and prevents use
- Dependencies: M1

## M4A – SDK (Client Library)

- Status: Not started
- Scope:
  - Publish `@convosensei/sdk` (TypeScript) with:
    - `init({ apiKey, baseUrl, environment })`
    - `track({ conversationId, messages[{ role, content, timestamp }], metadata })`
    - `wrap(openai|anthropic|fetch)` (optional auto‑tracking)
  - Behavior: API key auth; retries with backoff; optional small batching; flush on unload
- Acceptance:
  - Example app can send 100 msgs/min without blocking UX
  - Successful calls visible in server logs; data appears via read APIs
- Dependencies: M3

## M4B – Ingestion API (Minimal)

- Status: Not started
- Scope:
  - Route: `POST /api/v1/conversations/track`
  - Auth: API key header (prefix match + hash verify)
  - Idempotency: upsert `conversations` by `external_id`
  - Writes `messages` rows (role, content, timestamp, metadata)
  - Inline sentiment placeholder; or enqueue processing if queue enabled
- Acceptance:
  - SDK or cURL can push a sample conversation; it appears in dashboard reads
- Dependencies: M3

## M5 – Worker Pipeline (Queue + Processing)

- Status: Not started
- Scope:
  - BullMQ worker (Redis) and queues:
    - `ingest` (normalize/validate, write DB)
    - `process-conversation` (health scoring, failure detection)
    - `embed-conversation` (gated by `FEATURE_EMBEDDINGS`)
    - `pattern-analyze` scheduled weekly
  - Retries with backoff; basic DLQ/alert on repeated failure
  - Update DB: write health scores, failures; set `api_keys.last_used_at` on use
- Acceptance:
  - Ingest -> process -> dashboard reflects updates within seconds
  - Persistent failures visible in logs/DLQ
- Dependencies: M4B

## M6 – Alerts (Slack) – Optional for MVP

- Status: Not started
- Scope:
  - On new failure or health below threshold, POST to `app_settings.slack_webhook_url`
  - Message: short summary + deep link
- Acceptance:
  - With a valid webhook URL, events deliver to Slack
- Dependencies: M2, M3

## M7 – Frontend Switch To Live Data

- Status: Not started
- Scope:
  - Add Supabase client login (single admin)
  - Attach Bearer token to requests
  - Feature flag to toggle mock vs live per page; convert pages: Overview, Conversations, Failures, Settings
- Acceptance:
  - App loads with live data end‑to‑end; mock fallback behind flag only
- Dependencies: M2, M3

## M8 – Testing, Hardening, Deploy

- Status: Not started
- Scope:
  - Replace `db:push` with versioned migrations: `npm run db:generate` (+ migrator) for future changes
  - Remove `NODE_TLS_REJECT_UNAUTHORIZED=0` from scripts for CI/prod; rely on trusted TLS
  - Basic integration tests for core endpoints
  - Observability: request log, error handler; minimal health check endpoint
  - Deployment: environment config, start scripts, build pipeline
- Acceptance:
  - CI runs migrations and tests
  - Staging and production deploys succeed; env documented
- Dependencies: M1–M7 (as applicable)

## Open Questions / Decisions

- RLS: Defer or adopt later? (single‑admin MVP can run trusted backend without RLS)
- Realtime: Needed for MVP launch or post‑MVP?
- Embeddings pipeline: gated by `FEATURE_EMBEDDINGS`; when to enable?
- Slack vs generic webhooks: Slack only for MVP

## Current Risks & Mitigations

- Drift between mock and DB responses
  - Mitigation: add zod response schemas shared by client/server
- Auth verification incomplete
  - Mitigation: implement JWT verify in M1, gate all dashboard endpoints
- Migrations safety (using push in dev)
  - Mitigation: move to generate+migrate before production (M7)

## Quick Reference

- Env: `DATABASE_URL` (with `?sslmode=require`), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- Scripts: `npm run db:up` (ensure extensions + push schema), `npm run db:generate` (create SQL migrations)
- Schema highlights: `conversations`, `messages`, `failures`, `usage_patterns`, `conversation_embeddings`, `api_keys`, `app_settings`, `saved_views`
