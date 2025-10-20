# Sensei – Product Tracking Plan (MVP ➜ Prod)

This document tracks the concrete steps from the current codebase to a production‑ready MVP. Each item lists scope, acceptance criteria, and dependencies. Use it as the single checklist for PM + eng alignment.

## Milestones

- M0 – Database ready (Done)
- M1 – Auth + DB runtime wiring
- M2 – Read APIs (dashboard) – DB‑backed
- M3 – Settings + API Keys – DB‑backed
- M4A – SDK (client library)
- M4B – Ingestion API (track conversations)
- M4C – Demo Agent + SDK Playground
- M5 – Worker Pipeline (Queue + processing)
- M6 – Alerts (Slack) – optional for MVP
- M7 – Frontend switch to live data
- M8 – Testing, hardening, and deploy
- M9 – Growth & Adoption (Onboarding, Email, Analytics)
- M10 – Marketing Site (Landing Page)

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

- Status: Done
- Scope:
  - Implement Supabase JWT verification in middleware using `SUPABASE_JWT_SECRET` (or JWKS)
  - Add Drizzle runtime client: `server/db/client.ts` (pg pool + drizzle-orm/node-postgres)
  - Shared error util: map DB errors to `{ message, code? }`
- Acceptance:
  - All “Bearer” requests with a valid Supabase token pass; invalid are 401
  - A sample route can query the DB via `db` without crashing
- Dependencies: M0

## M2 – Read APIs (Dashboard) – DB‑Backed

- Status: Done
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
  - P95 ≤ 200ms locally for read endpoints (moved to M8 benchmarking)
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
  - Publish `@sensei/sdk` (TypeScript) with:
    - `init({ apiKey, baseUrl, environment })`
    - `track({ conversationId, messages[{ role, content, timestamp }], metadata })`
    - `wrap(openai|anthropic|fetch)` (optional auto‑tracking)
  - Behavior: API key auth; retries with backoff; optional small batching; flush on unload
  - Acceptance:
    - Example app can send 100 msgs/min without blocking UX
    - Successful calls visible in server logs; data appears via read APIs
  - Dependencies: M3

## M4C – Demo Agent + SDK Playground

- Status: Not started
- Scope:
  - Simple Node/TS demo agent that calls OpenAI (or mock) and integrates `@sensei/sdk`
  - CLI script and minimal web UI to run conversations; configurable with `.env`
  - Events flow through ingestion to DB so they appear in dashboard reads
  - Include seeded prompts and sample transcripts for demo purposes
- Acceptance:
  - `npm run demo:agent` runs a conversation and data shows in `/conversations` and analytics
  - README instructions for setup and API key use (one‑time secret from M3)
- Dependencies: M4A, M4B

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
  - Performance: benchmark read endpoints (P50/P95/P99); ensure P95 ≤ 200ms locally; add/adjust indexes if needed
- Acceptance:
  - CI runs migrations and tests
  - Staging and production deploys succeed; env documented
  - Performance targets verified for read endpoints (local dev)
- Dependencies: M1–M7 (as applicable)

## M9 – Growth & Adoption (Onboarding, Email, Analytics)

- Status: Not started
- Scope:
  - Email automation: transactional + onboarding (welcome, weekly summary); provider (Resend/Sendgrid/Postmark)
  - Product onboarding: in‑app checklist + guided tooltips; docs page: `docs/onboarding.md`
  - Analytics + session replay: integrate PostHog (events + replays) with env‑gated flags
  - Branding: basic brand kit (logo, colors), update README badges and screenshots
- Acceptance:
  - New admin receives welcome email and can trigger a weekly summary
  - First‑run experience shows onboarding checklist; key events visible in PostHog; session replay works
  - Privacy: DNT honored; ability to disable replays via env
- Dependencies: M7

## M10 – Marketing Site (Landing Page)

- Status: **IN PROGRESS** ✅
- Scope:
  - Mock up and ship a minimal landing page (hero, features, code snippet, CTA)
  - Collect waitlist/newsletter signups (Supabase table or provider form)
  - Basic SEO and social cards; link to GitHub and docs
- **COMPLETED TODAY:**
  - ✅ Landing page deployed to Vercel
  - ✅ Professional design with Inter font
  - ✅ Developer-focused copywriting ("Built for developers", "AI conversation monitoring for developers")
  - ✅ Comprehensive SEO tags (meta, Open Graph, Twitter Cards)
  - ✅ JSON-LD structured data for search engines
  - ✅ Tally form integration for waitlist collection
  - ✅ Responsive design with proper code block overflow handling
  - ✅ Updated product branding (ConvoSensei → Sensei)
- **NEXT STEPS:**
  - 🔄 Buy custom domain (getsensei.com or sensei.dev recommended)
  - 🔄 Update SEO tags with real domain URL
  - 🔄 Set up Vercel custom domain configuration
  - 🔄 Add analytics tracking (PostHog/Google Analytics)
- Acceptance:
  - ✅ Landing page deploys (Vercel), Lighthouse ≥ 90 perf/accessibility
  - ✅ Submissions stored and viewable; brand visuals consistent with app
- Dependencies: none

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
