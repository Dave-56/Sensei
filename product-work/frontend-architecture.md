Frontend Dashboard (Single-User + Supabase Auth)

Auth & App Shell

- Auth: Supabase Auth (single admin account). Use `@supabase/supabase-js` on the client; attach `Authorization: Bearer <access_token>` to API requests.
- Session: store in-memory on client; no server sessions. Logout clears Supabase session.
- Access control: all dashboard pages require an authenticated admin; ingestion API uses API keys (no user auth).

Pages

Overview Page (Home)
Big number cards: Current health score, Active conversations, Failure rate today
Line chart: Health score trend over past 7 days
Alert feed: Recent failures with links to conversations
Top 5 usage patterns with sparklines

Conversations List
Table with: Conversation ID, Health Score (color-coded), Duration, Status, Time
Filters: Date range, Health score range, Has failures, Pattern type
Click any row → opens conversation detail modal
Bulk export selected conversations

Conversation Detail (Modal/Sidebar)
Full message thread with user/AI labels
Health score breakdown (what knocked off points)
Detected failures highlighted in timeline
Sentiment graph across conversation
"Similar conversations" section

Patterns Page
Card grid of discovered patterns
Each card: Pattern name, example quote, occurrence count, trend arrow
Click card → see all conversations in this pattern
"Emerging patterns" section for new behaviors

Failures Page
Kanban board style: Loops | Frustration | Nonsense | Abrupt Ends
Each card is a failed conversation
Drag to "Resolved" column after fixing
Failure trends chart at top

Settings
API keys management
Slack webhook configuration
Alert thresholds (when to trigger notifications)
Admin account (Supabase Auth single-user)

API Integration

- Transport: REST over HTTPS to Express API at `/api/v1/*`.
- Auth: Bearer token from Supabase for dashboard requests; API key header for ingestion.
- Realtime: Supabase Realtime (Postgres Changes) channels for `failures` and `conversations` updates.
- Error handling: standardized JSON error envelope `{ message, code?, details? }`.

Route Map (Address Bar)

- `/` — Overview
- `/conversations` — Conversations list (row click opens detail modal)
- `/patterns` — Patterns grid (card click opens conversations-in-pattern view within page)
- `/failures` — Failures board + trends
- `/settings` — Settings (API keys, thresholds, Slack webhook, admin auth section)

Endpoint Mapping (Frontend → Backend)

- Overview: `GET /api/v1/analytics/summary`, `GET /api/v1/analytics/patterns`, `GET /api/v1/analytics/failures/trends`
- Conversations: `GET /api/v1/conversations`, `GET /api/v1/conversations/:id/messages`, `GET /api/v1/conversations/:id/health`, `GET /api/v1/conversations/:id/failures`
- Patterns: `GET /api/v1/analytics/patterns`, `GET /api/v1/patterns/:id/conversations`
- Failures: `GET /api/v1/failures`, `PATCH /api/v1/failures/:id`, `GET /api/v1/failures/board`
- Settings: `GET/PUT /api/v1/settings`, `GET/POST/DELETE /api/v1/api-keys`

Visual style:

Clean, minimal like Linear.app
Dark mode default (engineers love it)
Color coding: Green (healthy), Yellow (warning), Red (failure)
Lots of white space, no clutter
Every number clickable to drill down

Tech Notes

- Stack: React + Vite + Tailwind + Radix UI + TanStack Query.
- Data fetching: single typed API client; request/response types sourced from shared zod schemas.
- URL state: filters and pagination reflected in query params for deep links.
- Accessibility: focus management for modals/sidebars; keyboard navigation; color-contrast.
