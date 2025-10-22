import { db as pg } from "../db/client";
import {
  conversations as tConversations,
  messages as tMessages,
  failures as tFailures,
} from "@shared/db/schema";
import { asc, eq, inArray } from "drizzle-orm";
import { alertFailure, alertLowHealth } from "../integrations/slack";
import { embedConversation } from "./embeddings";
import { analyzeConversationPatterns } from "./patterns";

export async function processConversation(conversationId: string) {
  // Fetch messages
  const msgs = await pg
    .select({ role: tMessages.role, content: tMessages.content, timestamp: tMessages.timestamp })
    .from(tMessages)
    .where(eq(tMessages.conversationId, conversationId))
    .orderBy(asc(tMessages.timestamp));

  // Compute simple health
  const userMsgs = msgs.filter((m) => m.role === "user");
  const hasThanks = userMsgs.some((m) => /thank(s| you)/i.test(m.content));
  const clarificationPatterns = [/that's not/i, /I meant/i, /not what/i, /try again/i, /doesn't work/i];
  const clarifications = msgs.filter((m) => clarificationPatterns.some((p) => p.test(m.content))).length;
  let score = 100;
  score += hasThanks ? 5 : 0;
  score -= Math.min(clarifications * 10, 40);
  score = Math.max(0, Math.min(100, score));

  await pg.update(tConversations).set({ healthScore: score }).where(eq(tConversations.id, conversationId));

  // Slack alert: low health (best-effort)
  try {
    await alertLowHealth({ conversationId, score });
  } catch {}

  // Basic failure detection
  const failures: { type: "frustration" | "loop" | "nonsense" | "abrupt_end"; detected_at: Date }[] = [];
  if (clarifications >= 2) {
    failures.push({ type: "frustration", detected_at: new Date() });
  }

  // loop: repeated assistant replies or too many turns
  const assistantMsgs = msgs.filter((m) => m.role === "assistant");
  if (assistantMsgs.length >= 6) {
    failures.push({ type: "loop", detected_at: new Date() });
  }

  if (failures.length > 0) {
    const inserted = await pg
      .insert(tFailures)
      .values(
        failures.map((f) => ({
          conversationId,
          type: f.type,
          detectedAt: f.detected_at,
          status: "open" as const,
        })),
      )
      .returning({ id: tFailures.id, type: tFailures.type });

    // Slack alerts for new failures (best-effort)
    const alertedIds: string[] = [];
    for (const row of inserted) {
      try {
        const ok = await alertFailure({ conversationId, type: row.type as string });
        if (ok) alertedIds.push(row.id as any);
      } catch {}
    }
    if (alertedIds.length > 0) {
      try {
        await pg.update(tFailures).set({ alerted: true }).where(inArray(tFailures.id, alertedIds as any));
      } catch {}
    }
  }

  // Chain additional processing jobs
  try {
    // Generate embeddings
    await embedConversation(conversationId);
    console.log(`[queue] generated embeddings for conversation ${conversationId}`);
  } catch (e) {
    console.warn(`[queue] failed to generate embeddings for conversation ${conversationId}:`, e);
  }

  try {
    // Analyze patterns
    await analyzeConversationPatterns(conversationId);
    console.log(`[queue] analyzed patterns for conversation ${conversationId}`);
  } catch (e) {
    console.warn(`[queue] failed to analyze patterns for conversation ${conversationId}:`, e);
  }
}
