import { randomUUID } from "crypto";

export type MockMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  sentiment_score?: number;
};

export type MockConversation = {
  id: string;
  external_id?: string;
  started_at: string;
  ended_at?: string;
  health_score: number;
  status: "active" | "completed" | "abandoned";
  messages: MockMessage[];
};

export type MockFailure = {
  id: string;
  conversation_id: string;
  type: "loop" | "nonsense" | "frustration" | "abrupt_end";
  detected_at: string;
  status: "open" | "ack" | "resolved";
};

export const db = {
  conversations: [] as MockConversation[],
  failures: [] as MockFailure[],
  apiKeys: [{ id: "k1", name: "Default", prefix: "sk_test_", created_at: new Date().toISOString() }],
  settings: {
    slack_webhook_url: "",
    alert_thresholds: { health_min: 50, failure_rate_max: 5 },
  } as { slack_webhook_url: string; alert_thresholds: Record<string, unknown> },
};

// Seed minimal data
function seed() {
  if (db.conversations.length > 0) return;
  for (let i = 0; i < 10; i++) {
    const convId = randomUUID();
    const started = new Date(Date.now() - i * 3600_000);
    const userMsg: MockMessage = {
      id: randomUUID(),
      role: "user",
      content: `How do I ${i % 2 === 0 ? "reset password" : "export data"}?`,
      timestamp: started.toISOString(),
      sentiment_score: 0.1,
    };
    const aiMsg: MockMessage = {
      id: randomUUID(),
      role: "assistant",
      content: "Here are the steps...",
      timestamp: new Date(started.getTime() + 30_000).toISOString(),
      sentiment_score: 0.2,
    };
    db.conversations.push({
      id: convId,
      external_id: `conv_${i + 1}`,
      started_at: started.toISOString(),
      ended_at: new Date(started.getTime() + 60_000).toISOString(),
      health_score: 100 - i * 3,
      status: i % 5 === 0 ? "abandoned" : "completed",
      messages: [userMsg, aiMsg],
    });
    if (i % 3 === 0) {
      db.failures.push({
        id: randomUUID(),
        conversation_id: convId,
        type: (i % 2 === 0 ? "loop" : "frustration") as MockFailure["type"],
        detected_at: new Date().toISOString(),
        status: "open",
      });
    }
  }
}

seed();

export function paginate<T>(items: T[], page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    items: items.slice(start, end),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
}

