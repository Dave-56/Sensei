-- Enable extensions
create extension if not exists pgcrypto;
create extension if not exists vector;

-- Conversations
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  external_id varchar(255),
  started_at timestamp not null,
  ended_at timestamp,
  health_score integer,
  status varchar(50),
  metadata jsonb,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Messages
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  role varchar(50) not null,
  content text not null,
  timestamp timestamp not null,
  sentiment_score float,
  metadata jsonb
);

-- Failures
create type if not exists failure_status as enum ('open','ack','resolved');
create table if not exists failures (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  type varchar(100) not null,
  detected_at timestamp not null,
  details jsonb,
  alerted boolean default false,
  status failure_status not null default 'open',
  resolved_at timestamp,
  resolved_by uuid,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Usage Patterns
create table if not exists usage_patterns (
  id uuid primary key default gen_random_uuid(),
  pattern_name varchar(255),
  occurrence_count integer,
  first_seen timestamp,
  last_seen timestamp,
  embedding vector(1536)
);

-- Conversation embeddings
create table if not exists conversation_embeddings (
  conversation_id uuid primary key references conversations(id) on delete cascade,
  embedding vector(1536),
  created_at timestamp default now()
);
create index if not exists idx_conv_embeddings on conversation_embeddings using ivfflat (embedding vector_l2_ops);

-- Link table
create table if not exists pattern_conversations (
  pattern_id uuid references usage_patterns(id) on delete cascade,
  conversation_id uuid references conversations(id) on delete cascade,
  primary key (pattern_id, conversation_id)
);

-- API keys
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  name text,
  prefix text not null,
  key_hash text not null,
  last_used_at timestamp,
  revoked_at timestamp,
  created_at timestamp default now()
);

-- App settings (single row)
create table if not exists app_settings (
  id smallint primary key default 1,
  slack_webhook_url text,
  alert_thresholds jsonb default '{}'::jsonb,
  updated_at timestamp default now(),
  constraint app_settings_single_row check (id = 1)
);

-- Saved views
create type if not exists saved_view_scope as enum ('conversations','failures','patterns');
create table if not exists saved_views (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope saved_view_scope not null,
  config jsonb not null,
  created_at timestamp default now(),
  updated_at timestamp default now()
);
create index if not exists idx_saved_views_scope on saved_views(scope);

-- Indexes
create index if not exists idx_conversations_started_at on conversations(started_at desc);
create index if not exists idx_conversations_health on conversations(health_score);
create index if not exists idx_failures_type_time on failures(type, detected_at desc, status);
create index if not exists idx_messages_conversation_time on messages(conversation_id, timestamp);
create index if not exists idx_patterns_name on usage_patterns(pattern_name);

