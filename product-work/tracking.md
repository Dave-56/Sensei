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

## M2B - Write APIs (Dashboard/Admin)

- Status: Done
- **Implemented APIs (DB‑backed + validated):**
  - ✅ Failures: `GET /api/v1/failures`, `GET /api/v1/failures/board`, `PATCH /api/v1/failures/:id`
  - ✅ Settings: `GET/PUT /api/v1/settings`
  - ✅ API Keys: `GET/POST/DELETE /api/v1/api-keys` (scrypt hash, soft revoke)
  - ✅ Saved Views: `POST/PUT/DELETE /api/v1/saved-views`
- Acceptance:
  - Writes persist to Supabase DB; invalid payloads return 400 with details
  - Idempotent updates where applicable (settings/saved views)
- Dependencies: M1 (DB client + auth), M3 (for API key hashing helper)

## M3 – Settings + API Keys – DB‑Backed

- Status: Done
- **Implemented:**
  - ✅ Settings: `GET/PUT /api/v1/settings` (DB‑backed, idempotent, zod)
  - ✅ API Keys: `GET/POST/DELETE /api/v1/api-keys` (scrypt hash, metadata‑only listing, soft revoke)
  - ✅ Ingestion middleware updates `last_used_at` on successful key use
- Acceptance:
  - Creating a key returns one‑time secret; listing shows only metadata
  - Revoking removes/marks key and prevents use
- Dependencies: M1

## M4A – SDK (Client Library)

- Status: Partial
- Implemented:
  - ✅ Local TypeScript SDK in `sdk/index.ts` with `init/track`, timestamp normalization, optional batching, and unload flush
  - ✅ Used by demo agent script
- Remaining:
  - ⏩ Publish to npm (`@sensei/sdk`) and add README
  - ⏩ Retries with backoff; wrappers (`wrap(openai|anthropic|fetch)`) for auto‑tracking
- Acceptance:
  - Local SDK can send 100 msgs/min without blocking UX
  - Successful calls visible in server logs; data appears via read APIs
- Dependencies: M3

## M4B – Ingestion API (Minimal)

- Status: Done ✅
- Implemented:
  - ✅ Route: `POST /api/v1/conversations/track` (DB‑backed, zod‑validated, transaction)
  - ✅ Auth: API key header (prefix + scrypt hash verify; revoked keys rejected)
  - ✅ Upsert conversation by `external_id`; insert `messages` (role, content, timestamp, metadata)
  - ✅ Post‑ingest processing: enqueue to BullMQ via `REDIS_URL` or inline fallback; computes `health_score` and basic failures
- Acceptance:
  - SDK or cURL can push a sample conversation; it appears in dashboard reads and analytics reflect processing
  - Server logs show processing path: `[queue] …` when BullMQ is active (with `REDIS_URL`), or `[inline] …` when falling back
- Dependencies: M3

## M4C – Demo Agent + SDK Playground

 - Status: Done
 - Implemented:
   - ✅ Demo agent script: `npm run demo:agent` pushes a sample conversation via SDK
   - ✅ SDK scaffold: `sdk/index.ts` with `init/track` and batching
 - Acceptance:
   - Running the demo inserts data visible in conversations/messages APIs

## M5 – Worker Pipeline (Queue + Processing)

- Status: **Done** ✅
- Implemented:
  - ✅ `process-conversation` queue using BullMQ when `REDIS_URL` is set; inline fallback otherwise
  - ✅ Worker + scheduler initialized in `server/queue/index.ts`
  - ✅ Enqueue from `POST /api/v1/conversations/track` (best‑effort)
  - ✅ Exponential backoff + `attempts: 3` on enqueue
  - ✅ Console logs for visibility: init, enqueue, start, complete
  - ✅ **Separate `ingest` queue** (normalize/validate before DB write)
  - ✅ **`embed-conversation` and `pattern-analyze` scheduled jobs** (simple implementations)
- Not yet implemented:
  - ⏩ DLQ/alerts for repeated failure (optional for MVP)
  - ⏩ Update `api_keys.last_used_at` in worker (can be added later)
- Acceptance:
  - New conversations trigger ingest → process → embeddings + patterns pipeline
  - Health scores, failures, embeddings, and patterns update within seconds
  - Logs show `[queue]` path when Redis is active; fallback shows `[inline]`
- How to verify (dev):
  - Start Redis: `docker run --rm -p 6379:6379 redis:7-alpine`
  - Set `REDIS_URL=redis://localhost:6379` and restart server (`npm run dev`)
  - Run demo: `npm run demo:agent`
  - Expect server logs:
    - Init: `[queue] initialized BullMQ for "ingest-conversation"` and `"process-conversation"`
    - Ingest: `[queue] ingesting conversation <externalId>` → `[queue] ingested conversation`
    - Process: `[queue] processing conversation <id>` → `[queue] generated embeddings` → `[queue] analyzed patterns`
  - Optional Redis checks:
    - `redis-cli -u "$REDIS_URL" PING` → `PONG`
    - `redis-cli -u "$REDIS_URL" --raw SCAN 0 MATCH bull:ingest-conversation:* COUNT 100`
    - `redis-cli -u "$REDIS_URL" --raw SCAN 0 MATCH bull:process-conversation:* COUNT 100`
- Dependencies: M4B

## M6 – Alerts (Slack) – Optional for MVP

- Status: Partial ✅
- Implemented:
  - ✅ Integration module: `server/integrations/slack.ts` (reads webhook from DB `app_settings.slack_webhook_url` with env fallback `SLACK_WEBHOOK_URL`)
  - ✅ Alerts on new failures from worker (`process-conversation`): sets `failures.alerted = true` on success
  - ✅ Low‑health alert (default threshold 40, currently hardcoded) after health score update
  - ✅ Basic dashboard deep link to `/conversations`
- Remaining:
  - ⏩ Make threshold configurable via `app_settings.alert_thresholds` (e.g., `{ "low_health": 40 }`) — defer until frontend/settings work (M7)
  - ⏩ Richer Slack formatting (per‑type details, direct deep link to conversation detail view once available)
  - ⏩ Toggle to enable/disable alerts in settings UI — defer to M7
- How to verify:
  - Set `SLACK_WEBHOOK_URL` or update Settings (slack_webhook_url)
  - Run demo agent; when a failure is detected or health < 40, Slack receives a message
  - Check DB `failures.alerted` flips to true after a successful post
- Dependencies: M2, M3

## M7 – Frontend Switch To Live Data

- Status: Partial ✅
- Scope:
  - Add Supabase client login (single admin)
  - Attach Bearer token to requests
  - Feature flag to toggle mock vs live per page; convert pages: Overview, Conversations, Failures, Settings
- Acceptance:
  - App loads with live data end‑to‑end; mock fallback behind flag only
 - Implemented today:
  - ✅ Live Data toggle (localStorage) + header switch; default OFF (mock)
  - ✅ Overview page reads `/api/v1/analytics/summary` when Live Data is ON; otherwise uses mock values
 - Remaining to convert:
  - ⏩ Replace mock tables/charts for Conversations, Failures, Patterns pages with live endpoints, guarded by the same toggle
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

- **Mock vs DB Data Drift** ⚠️ **ACTIVE RISK**
  - **Issue**: Write APIs use mock DB while read APIs use Supabase DB, causing data inconsistency
  - **Impact**: Write operations (failures, settings, API keys) don't persist and are lost on restart
  - **Mitigation**: Migrate all write APIs to Supabase DB (priority fix)
- **Missing Request Validation** ⚠️ **ACTIVE RISK**
  - **Issue**: Write APIs lack zod validation, allowing malicious payloads
  - **Impact**: Security vulnerability, no proper error responses
  - **Mitigation**: Add zod schemas for all request bodies (tracking requirement)
- **API Key Security** ⚠️ **ACTIVE RISK**
  - **Issue**: API keys stored in plaintext, no hashing, no usage tracking
  - **Impact**: Security vulnerability, no audit trail
  - **Mitigation**: Implement bcrypt/scrypt/argon2 hashing and `last_used_at` tracking
- **Saved Views Missing** ⚠️ **ACTIVE RISK**
  - **Issue**: Database schema ready but no API endpoints implemented
  - **Impact**: Feature incomplete, database table unused
  - **Mitigation**: Create saved views API routes (infrastructure ready)
- Auth verification incomplete
  - Mitigation: implement JWT verify in M1, gate all dashboard endpoints
- Migrations safety (using push in dev)
  - Mitigation: move to generate+migrate before production (M7)

## Quick Reference

- Env: `DATABASE_URL` (with `?sslmode=require`), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- Scripts: `npm run db:up` (ensure extensions + push schema), `npm run db:generate` (create SQL migrations)
- Schema highlights: `conversations`, `messages`, `failures`, `usage_patterns`, `conversation_embeddings`, `api_keys`, `app_settings`, `saved_views`
