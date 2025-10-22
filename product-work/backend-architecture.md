# InsightLoop - Software Architecture (Single-User + Supabase)

## Overview
A lightweight analytics platform for AI conversations that tracks health scores, detects failures, and identifies usage patterns.

## Tech Stack
- **Backend**: Node.js + Express (fast iteration, huge ecosystem)
- **Database**: Supabase (PostgreSQL) accessed via Drizzle ORM; Supabase Realtime for live updates; Supabase Storage for exports
- **Auth**: Supabase Auth (single admin account)
- **Queue**: BullMQ (Redis) for background jobs
- **Embeddings**: OpenAI text-embedding-3-small (1536 dims; note model/version)
- **Frontend**: React + Vite + Tailwind (ship fast, look good)
- **Deployment**: Railway or Render (API/worker) + Vercel/Netlify (web) or unified on one platform

## System Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Customer   │────▶│   SDK/API    │────▶│   Ingress   │
│  AI Apps    │     │   Gateway    │     │   Queue     │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
                    ┌──────────────────────────────────────┐
                    │       Processing Pipeline            │
                    │  ┌────────────┐  ┌───────────────┐ │
                    │  │   Health   │  │   Failure     │ │
                    │  │   Scorer   │  │   Detector    │ │
                    │  └────────────┘  └───────────────┘ │
                    │         ┌──────────────┐           │
                    │         │   Pattern    │           │
                    │         │   Analyzer   │           │
                    │         └──────────────┘           │
                    └──────────────────────────────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │          Storage             │
                    │  ┌──────────┐  ┌──────────┐│
                    │  │ Supabase │  │  Redis   ││
                    │  └──────────┘  └──────────┘│
                    └──────────────────────────────┘
                                    │
                    ┌───────────────▼──────────────┐
                    │      Dashboard API           │
                    └──────────────────────────────┘
```

## Auth & Authorization

Single-user MVP: one admin account in Supabase Auth. No teams/orgs, roles, invites, or member management.

- Dashboard requests: require `Authorization: Bearer <supabase_access_token>`; API verifies JWT using Supabase JWKS or `SUPABASE_JWT_SECRET`.
- Ingestion requests: authenticated with API keys (no Supabase Auth). Keys are hashed at rest and scoped globally.
- CORS: allow only the dashboard origin. No cookies required; tokens in Authorization header.
- Realtime: Supabase Realtime channels scoped to global tables (`failures`, `conversations`).

## SDK Design

### JavaScript/TypeScript SDK

```javascript
// Customer installs: npm install @insightloop/sdk

// Usage in their app:
import { InsightLoop } from '@insightloop/sdk';

const insights = new InsightLoop({
    apiKey: process.env.INSIGHTLOOP_API_KEY, // single-user admin key
    environment: 'production'
});

// Wrap OpenAI calls
const openai = new OpenAI();
const completion = await openai.chat.completions.create({
    messages: messages,
    model: 'gpt-4'
});

// Track the conversation
insights.track({
    conversationId: 'conv_123',
    messages: messages.concat([completion.choices[0].message]),
    metadata: { userId: 'user_456' }
});

// Or use auto-wrapper
const wrappedOpenAI = insights.wrap(openai);
// Now all calls are automatically tracked
```

## API Endpoints

Note: Dashboard UI routes are normalized (e.g., `/conversations`) and do not include `/v1`. The API surface is versioned under `/api/v1/*`.

### Ingestion API (API key auth)
```
POST /api/v1/conversations/track
{
    "conversationId": "external_id",
    "messages": [
        {"role": "user", "content": "...", "timestamp": "..."},
        {"role": "assistant", "content": "...", "timestamp": "..."}
    ],
    "metadata": {}
}
```

Ingestion enriches messages with `sentiment_score` during processing so Health Scorer signals are available to the dashboard.

### Analytics API (Bearer auth — Supabase admin)
```
GET /api/v1/conversations?from=&to=&health_min=&health_max=&has_failures=&pattern_id=&page=&page_size=
GET /api/v1/conversations/:id/health
GET /api/v1/conversations/:id/failures
GET /api/v1/analytics/patterns?timeframe=7d                   # includes trend fields and sparkline points
GET /api/v1/analytics/summary?timeframe=24h|7d|30d
GET /api/v1/patterns/:id/conversations?page=&page_size=
GET /api/v1/conversations/:id/health/details
GET /api/v1/conversations/:id/similar?limit=10
GET /api/v1/conversations/export               # CSV stream (honors filters or selected ids)
POST /api/v1/conversations/export              # CSV stream; body: { ids: [uuid,…] }
GET /api/v1/conversations/:id/messages
GET /api/v1/analytics/failures/trends?bucket=hour|day&from=&to=
```

### Saved Views API (Bearer auth)
```
# Save and manage reusable filter/sort/column presets (single-user)
GET    /api/v1/saved-views                       # list all views
POST   /api/v1/saved-views                       # create view { name, scope, config }
PUT    /api/v1/saved-views/:id                   # update view
DELETE /api/v1/saved-views/:id                   # delete view
```

### Failures API (Bearer auth)
```
GET /api/v1/failures?status=open|ack|resolved&type=&from=&to=&page=&page_size=&limit=
PATCH /api/v1/failures/:id { status }       # update failure status
GET /api/v1/failures/board?group_by=type&status=open&from=&to=   # convenience: returns columns by failure type
```

### Webhook API
```
POST /api/v1/webhooks/failures
{
    "url": "https://customer.com/webhook",
    "events": ["failure.detected", "health.low"]
}
```

### Settings & API Keys (Bearer auth for management)
```
GET    /api/v1/settings                      # global app settings
PUT    /api/v1/settings                      # update slack webhook, thresholds

GET    /api/v1/api-keys                      # list keys (metadata only)
POST   /api/v1/api-keys                      # create key (returns prefix + secret once)
DELETE /api/v1/api-keys/:id                  # revoke key
```

Single-user mode: no teams/orgs; no members/roles CRUD. Supabase Auth maintains the single admin user in `auth.users`.

## Database Schema (Single User)

### Supabase Features
- **Postgres**: Primary data store (Drizzle migrations)
- **Realtime**: Live updates for dashboard metrics
- **Storage**: Conversation exports (CSV) and attachments
- **Auth**: Single admin; JWT verified by API
- **pgvector**: Vector similarity search for embeddings

### Database Schema (Supabase Postgres)

```sql
-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255), -- customer's conversation ID
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    health_score INTEGER,
    status VARCHAR(50), -- 'active', 'completed', 'abandoned'
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    role VARCHAR(50), -- 'user', 'assistant'
    content TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    sentiment_score FLOAT, -- -1 to 1
    metadata JSONB
);

-- Failures
CREATE TABLE failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    type VARCHAR(100), -- 'loop', 'nonsense', 'frustration', 'abrupt_end'
    detected_at TIMESTAMP NOT NULL,
    details JSONB,
    alerted BOOLEAN DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','ack','resolved')),
    resolved_at TIMESTAMP,
    resolved_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage Patterns
CREATE TABLE usage_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name VARCHAR(255),
    occurrence_count INTEGER,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    embedding VECTOR(1536) -- for similarity search
);

-- Conversation embeddings for similarity
CREATE TABLE conversation_embeddings (
  conversation_id UUID PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_conv_embeddings
  ON conversation_embeddings USING ivfflat (embedding vector_l2_ops);

-- Link table for patterns to conversations
CREATE TABLE pattern_conversations (
    pattern_id UUID REFERENCES usage_patterns(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    PRIMARY KEY (pattern_id, conversation_id)
);

-- API keys (hashed) - global (no org_id)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    last_used_at TIMESTAMP,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- App-level settings (alert thresholds, webhooks) - single row
CREATE TABLE app_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    slack_webhook_url TEXT,
    alert_thresholds JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Optional: simple updated_at triggers
-- CREATE TRIGGER set_timestamp BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
-- CREATE TRIGGER set_timestamp_failures BEFORE UPDATE ON failures FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
```

### Identifiers
- Internal URLs and joins use `id` (UUID).
- The dashboard displays `external_id` as the Conversation ID when present; detail routes still use internal `id`.

### Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_health ON conversations(health_score);
CREATE INDEX IF NOT EXISTS idx_failures_type_time ON failures(type, detected_at DESC, status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time ON messages(conversation_id, timestamp);
 CREATE INDEX IF NOT EXISTS idx_patterns_name ON usage_patterns(pattern_name);
 ```

#### Saved Views
```sql
-- Saved Views for reusable filters/sorts/columns (single-user)
CREATE TABLE saved_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('conversations','failures','patterns')),
    config JSONB NOT NULL, -- e.g., { filters: {...}, sort: {...}, columns: [...] }
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_saved_views_scope ON saved_views(scope);
```

## Core Processing Logic

### 1. Health Score Calculator

```javascript
class HealthScorer {
    calculateScore(conversation) {
        let score = 100;

        // Completion tracking (-30 points if abandoned)
        if (this.isAbandoned(conversation)) score -= 30;

        // Sentiment analysis (-20 points for negative shift)
        const sentimentShift = this.calculateSentimentShift(conversation);
        if (sentimentShift < -0.5) score -= 20;

        // Follow-up patterns (-10 points per clarification)
        const clarifications = this.countClarifications(conversation);
        score -= (clarifications * 10);

        // Success signals (+10 for thanks, resolved, etc)
        if (this.hasSuccessSignals(conversation)) score += 10;

        return Math.max(0, Math.min(100, score));
    }

    isAbandoned(conversation) {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        return lastMessage.role === 'assistant' && !conversation.ended_at;
    }

    calculateSentimentShift(conversation) {
        // Compare first vs last user message sentiment
        const userMessages = conversation.messages.filter(m => m.role === 'user');
        if (userMessages.length < 2) return 0;

        return userMessages[userMessages.length-1].sentiment_score - userMessages[0].sentiment_score;
    }

    countClarifications(conversation) {
        const patterns = [
            /that's not/i, /I meant/i, /not what/i, 
            /try again/i, /doesn't work/i
        ];
        return conversation.messages.filter(m => 
            patterns.some(p => p.test(m.content))
        ).length;
    }
}
```

### 2. Failure Detection

```javascript
class FailureDetector {
    async detectFailures(conversation) {
        const failures = [];

        // Loop detection
        if (this.hasLoops(conversation)) {
            failures.push({
                type: 'loop',
                details: { repeatedContent: '...' }
            });
        }

        // Frustration signals
        const frustration = this.detectFrustration(conversation);
        if (frustration) {
            failures.push({
                type: 'frustration',
                details: frustration
            });
        }

        // Nonsense detection (using embeddings)
        if (await this.detectNonsense(conversation)) {
            failures.push({
                type: 'nonsense',
                details: { mismatchScore: '...' }
            });
        }

        // Abrupt endings
        if (this.hasAbruptEnding(conversation)) {
            failures.push({
                type: 'abrupt_end',
                details: { lastResponseTime: '...' }
            });
        }

        return failures;
    }

    hasLoops(conversation) {
        const assistantMessages = conversation.messages
            .filter(m => m.role === 'assistant')
            .map(m => m.content);

        // Check for repeated responses
        const counts = {};
        for (const msg of assistantMessages) {
            counts[msg] = (counts[msg] || 0) + 1;
            if (counts[msg] >= 3) return true;
        }
        return false;
    }

    detectFrustration(conversation) {
        const signals = [
            /this is useless/i,
            /you're not helping/i,
            /frustrated/i,
            /[!?]{3,}/,
            /HELP/
        ];

        for (const message of conversation.messages) {
            for (const signal of signals) {
                if (signal.test(message.content)) {
                    return { trigger: message.content };
                }
            }
        }
        return null;
    }
}
```

### 3. Pattern Analysis

```javascript
class PatternAnalyzer {
    async analyzePatterns(conversations) {
        // Generate embeddings for first user message
        const embeddings = await this.generateEmbeddings(
            conversations.map(c => c.messages[0].content)
        );

        // Cluster similar conversations
        const clusters = await this.clusterEmbeddings(embeddings);

        // Extract patterns from clusters
        const patterns = clusters.map(cluster => ({
            pattern_name: this.extractPatternName(cluster),
            example_conversations: cluster.conversationIds,
            occurrence_count: cluster.size
        }));

        return patterns;
    }

    async generateEmbeddings(texts) {
        // Call OpenAI embeddings API (text-embedding-3-small, 1536)
        const response = await openai.embeddings.create({
            input: texts,
            model: "text-embedding-3-small"
        });
        return response.data;
    }

    async clusterEmbeddings(embeddings) {
        // Simple k-means clustering
        // For MVP, use a library like ml-kmeans
        const kmeans = new KMeans({
            k: 10, // start with 10 clusters
            maxIterations: 100
        });
        return kmeans.cluster(embeddings);
    }
}
```

## Background Processing

```javascript
// Process new conversations every minute
queue.add('process-conversations', {}, {
    repeat: { pattern: '* * * * *' }
});

// Generate pattern reports weekly
queue.add('generate-pattern-report', {}, {
    repeat: { pattern: '0 0 * * 0' } // Sunday midnight
});

// Alert on failures immediately
queue.add('failure-alert', { conversationId }, {
    removeOnComplete: true,
    attempts: 3
});
```

## Dashboard Features

### Key Metrics View
- Average health score (last 24h, 7d, 30d)
- Failure rate by type
- Top usage patterns (with trend and sparkline)
- Conversation volume trends

### Conversation Explorer
- Filter by health score, failures, patterns
- Search within conversations
- Export to CSV (filters or selected IDs)
- Saved views (filters/sort/columns) with quick select

### Real-time Monitoring
- WebSocket connection for live updates
- Failure alerts feed
- Health score distribution chart

## Deployment & Operations

### Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=eyJ...           # for direct JWT verification in Express
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
SLACK_WEBHOOK_URL=https://... # optional global fallback; prefer app_settings
PORT=3000
NODE_ENV=production
```

### Deployment Steps

1. **Supabase Setup**
   ```bash
   # Create new Supabase project at https://supabase.com
   # Run SQL migrations in Supabase SQL Editor
   ```

2. **Redis Setup**
   ```bash
   redis-server
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Add your Supabase keys and other credentials
   ```

5. **Start Services**
   ```bash
   npm run start:worker  # Background jobs
   npm run start:api     # API server
   npm run start:dashboard # Vite/React dashboard
   ```

## Monitoring & Observability

* **Metrics**: Prometheus + Grafana for system metrics (CPU, memory, queue depths, processing latency)
* **Logging**: Structured logs (JSON) → ELK stack or DataDog for centralized log analysis
* **Tracing**: OpenTelemetry for request flow across services (SDK → ingest → processing → storage)
* **Alerts**: PagerDuty integration for critical failures (LLM judge timeouts, queue backup, DB connection issues)
* **Health Checks**: `/health` endpoints on all services with dependency checks
* **Business Metrics**: Cost, feature adoption rates, processing throughput


## Future Extensibility

* Route/version experiments, RAG-specific signals, tool-use analytics, human-in-the-loop QA queue, JIRA/Linear export, SOC2.

## Non-Goals (MVP)

* Custom visual dashboard builder or arbitrary SQL queries
* Multi-user teams, roles/permissions, or shared views
* Cross-page composed widgets and public share links

## Realtime

* Supabase Realtime (Postgres Changes)
* Failures stream: table `failures` on INSERT/UPDATE → channel `realtime:failures`
* Health stream: table `conversations` on UPDATE when `health_score` changes → channel `realtime:conversations`

Event payloads include minimal fields for efficient UI updates:
- `realtime:failures`: `id`, `conversation_id`, `type`, `status`, `detected_at`, `updated_at`
- `realtime:conversations`: `id`, `external_id`, `health_score`, `updated_at`

## MVP Development Plan (Single-User + Supabase)

### Week 1: Core Infrastructure
- [ ] Database schema setup
- [ ] Basic API endpoints
- [ ] SDK prototype
- [ ] Simple health score calculation

### Week 2: Processing Pipeline
- [ ] Failure detection algorithms
- [ ] Background job processing
- [ ] Webhook system
- [ ] Basic pattern clustering

### Week 3: Dashboard
- [ ] Metrics overview page
- [ ] Conversation explorer
- [ ] Real-time updates
- [ ] Export functionality

### Week 4: Polish & Launch
- [ ] Testing with beta users
- [ ] Documentation
- [ ] Landing page
- [ ] Launch on Product Hunt

## Performance Targets
- Process 1000 conversations/minute
- Health score calculation < 100ms
- Dashboard load time < 2s
- 99.9% uptime

## Evolved Product Addendum (vNext)

This addendum documents the evolved product scope. It introduces Problem Clustering, Usage Intent Clustering, and clearer Health Scoring, shipped behind feature flags and without disrupting current milestones.

- Feature flags:
  - `FEATURE_CLUSTERING` — enable problem clustering endpoints and jobs
  - `FEATURE_INTENTS` — enable usage intent clustering endpoints and jobs
  - `ENABLE_PII_REDACTION` — redact PII before LLM/embedding calls

- API additions (Bearer auth):
  - Problems:
    - `GET /api/v1/problems/top` — ranked clusters with counts and week-over-week trend
    - `GET /api/v1/problems/:clusterId/traces` — example conversations in a cluster (paged)
    - `GET /api/v1/problems/trends` — per-cluster daily counts (optional)
  - Usage:
    - `GET /api/v1/usage/intents` — clusters with share and health
    - `GET /api/v1/usage/intents/:clusterId/traces` — example conversations
  - Health:
    - `GET /api/v1/analytics/health/summary` — overall health and trend

- Data model (new tables; illustrative):
  - `problem_clusters` (id, name, algo_version, timeframe, created_at, stats json)
  - `conversation_problem_labels` (conversation_id, cluster_id, primary_label text, confidence, reasons json)
  - `usage_intent_clusters` (id, name, label_source, algo_version, created_at, stats json)
  - `conversation_intents` (conversation_id, cluster_id, confidence, exemplar_message_id)
  - `conversation_health_metrics` (conversation_id, completion float, sentiment float, resolution float, score int, version text, computed_at)
  - Extend `conversation_embeddings` with a `type` enum/text column: `problem|intent` to allow multiple embedding types

- Worker/queue updates:
  - Health scoring v1: weighted components (completion 40%, sentiment 30%, resolution 30%); v2 adds trajectory analysis; store `version`
  - Detection signals: loops, nonsense (LLM judge), frustration, low health threshold; persist per-conversation `problem_signals`
  - Clustering cadence: nightly `cluster-problems` and `cluster-intents` jobs; append-only labels; record `algo_version`
  - Queue topology: `ingest-conversation` → `process-conversation` → `embed-conversation` → `cluster-problems`/`cluster-intents`
  - Guardrails: batch external calls, cap items/run, PII redaction prior to LLM/embeddings

- Frontend alignment:
  - Overview: Overall Health card, Top Problems tile, Usage Patterns tile with links to drilldowns
  - Drilldowns: cluster detail pages list representative traces; conversation detail remains unchanged

### Example SQL (vNext)

```sql
-- Problem Clusters
CREATE TABLE IF NOT EXISTS problem_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  algo_version TEXT NOT NULL,
  timeframe TEXT,                 -- e.g., 'last_7d'
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_problem_labels (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES problem_clusters(id) ON DELETE CASCADE,
  primary_label TEXT,
  confidence REAL,
  reasons JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (conversation_id, cluster_id)
);

-- Usage Intent Clusters
CREATE TABLE IF NOT EXISTS usage_intent_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  label_source TEXT,              -- 'llm' | 'manual'
  algo_version TEXT NOT NULL,
  stats JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_intents (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  cluster_id UUID REFERENCES usage_intent_clusters(id) ON DELETE CASCADE,
  confidence REAL,
  exemplar_message_id UUID REFERENCES messages(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (conversation_id, cluster_id)
);

-- Health metrics (component breakdown + version)
CREATE TABLE IF NOT EXISTS conversation_health_metrics (
  conversation_id UUID PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
  completion REAL,    -- 0..1
  sentiment REAL,     -- -1..1 or 0..1 normalized
  resolution REAL,    -- 0..1
  score INT,          -- 0..100
  version TEXT NOT NULL,
  computed_at TIMESTAMP DEFAULT NOW()
);

-- Option: evolve embeddings to support multiple types per conversation
-- If you already have a PK on (conversation_id), move to composite PK (conversation_id, type)
DO $$ BEGIN
  ALTER TABLE conversation_embeddings DROP CONSTRAINT conversation_embeddings_pkey;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

ALTER TABLE conversation_embeddings
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'problem' CHECK (type IN ('problem','intent'));

DO $$ BEGIN
  ALTER TABLE conversation_embeddings ADD PRIMARY KEY (conversation_id, type);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- Optional: IVFFLAT index remains valid; consider per-type partial indexes if needed
-- CREATE INDEX IF NOT EXISTS idx_conv_embeddings_problem ON conversation_embeddings USING ivfflat (embedding vector_l2_ops) WHERE type='problem';
-- CREATE INDEX IF NOT EXISTS idx_conv_embeddings_intent  ON conversation_embeddings USING ivfflat (embedding vector_l2_ops) WHERE type='intent';
```
