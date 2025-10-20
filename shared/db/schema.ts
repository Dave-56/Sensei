import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  integer,
  doublePrecision,
  boolean,
  jsonb,
  smallint,
  primaryKey,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// Custom pgvector type (vector(1536))
import { customType } from "drizzle-orm/pg-core";

export const vector = (dimensions: number) =>
  customType<{ data: number[]; notNull: false; default: false } & { config: { dimensions: number } }>({
    dataType() {
      return `vector(${dimensions})`;
    },
  });

// Enums
export const failureStatusEnum = pgEnum("failure_status", ["open", "ack", "resolved"]);
export const savedViewScopeEnum = pgEnum("saved_view_scope", [
  "conversations",
  "failures",
  "patterns",
]);

// OAuth providers
export const oauthProviderEnum = pgEnum("oauth_provider", ["email", "google", "github"]);

// Conversations
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: varchar("external_id", { length: 255 }),
  startedAt: timestamp("started_at", { withTimezone: false }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: false }),
  healthScore: integer("health_score"),
  status: varchar("status", { length: 50 }), // 'active','completed','abandoned'
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: false }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: false }).default(sql`now()`),
});

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  role: varchar("role", { length: 50 }).notNull(), // 'user','assistant'
  content: text("content").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: false }).notNull(),
  sentimentScore: doublePrecision("sentiment_score"),
  metadata: jsonb("metadata"),
});

// Failures
export const failures = pgTable("failures", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  type: varchar("type", { length: 100 }).notNull(), // 'loop','nonsense','frustration','abrupt_end'
  detectedAt: timestamp("detected_at", { withTimezone: false }).notNull(),
  details: jsonb("details"),
  alerted: boolean("alerted").default(false),
  status: failureStatusEnum("status").notNull().default("open"),
  resolvedAt: timestamp("resolved_at", { withTimezone: false }),
  resolvedBy: uuid("resolved_by"),
  createdAt: timestamp("created_at", { withTimezone: false }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: false }).default(sql`now()`),
});

// Usage Patterns
export const usagePatterns = pgTable("usage_patterns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patternName: varchar("pattern_name", { length: 255 }),
  occurrenceCount: integer("occurrence_count"),
  firstSeen: timestamp("first_seen", { withTimezone: false }),
  lastSeen: timestamp("last_seen", { withTimezone: false }),
  embedding: vector(1536)("embedding"),
});

// Conversation embeddings
export const conversationEmbeddings = pgTable("conversation_embeddings", {
  conversationId: uuid("conversation_id").primaryKey().references(() => conversations.id, { onDelete: "cascade" }),
  embedding: vector(1536)("embedding"),
  createdAt: timestamp("created_at", { withTimezone: false }).default(sql`now()`),
});

// Link table
export const patternConversations = pgTable(
  "pattern_conversations",
  {
    patternId: uuid("pattern_id").notNull().references(() => usagePatterns.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.patternId, t.conversationId] }),
  }),
);

// API keys
export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  prefix: text("prefix").notNull(),
  keyHash: text("key_hash").notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: false }),
  revokedAt: timestamp("revoked_at", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).default(sql`now()`),
});

// App settings (single row)
export const appSettings = pgTable("app_settings", {
  id: smallint("id").primaryKey().default(1),
  slackWebhookUrl: text("slack_webhook_url"),
  alertThresholds: jsonb("alert_thresholds").default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: false }).default(sql`now()`),
});

// Saved views
export const savedViews = pgTable("saved_views", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  scope: savedViewScopeEnum("scope").notNull(),
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: false }).default(sql`now()`),
});

// Users (moved from shared/schema.ts)
// Note: We use Supabase Auth as source of truth for users.
// Keep app profile and security data in public schema.

// User profile and security
export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id").primaryKey(),
  email: text("email").notNull().unique(),
  primaryProvider: oauthProviderEnum("primary_provider").default("email").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: false }),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: false }),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  createdAt: timestamp("created_at", { withTimezone: false }).default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: false }).default(sql`now()`),
});

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(),
  device: text("device"),
  userAgent: text("user_agent"),
  ip: varchar("ip", { length: 45 }),
  city: text("city"),
  region: text("region"),
  country: text("country"),
  lastSeen: timestamp("last_seen", { withTimezone: false }),
  createdAt: timestamp("created_at", { withTimezone: false }).default(sql`now()`),
  revokedAt: timestamp("revoked_at", { withTimezone: false }),
});

export const userSecurityLogs = pgTable(
  "user_security_logs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: false }).default(sql`now()`),
  },
  (t) => ({
    idxUserTime: index("idx_security_logs_user_time").on(t.userId, t.createdAt),
  }),
);
