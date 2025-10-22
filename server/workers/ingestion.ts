import { db as pg } from "../db/client";
import { conversations as tConversations, messages as tMessages } from "@shared/db/schema";
import { eq } from "drizzle-orm";
// Import moved to avoid circular dependency

export async function ingestConversation(data: {
  conversationId: string; // external id from client
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
  metadata?: Record<string, any>;
}) {
  const { conversationId: externalId, messages, metadata } = data;
  
  // Validate and normalize timestamps
  const times = messages.map((m) => new Date(m.timestamp).getTime());
  const startedAt = new Date(Math.min(...times));
  const endedAt = new Date(Math.max(...times));

  console.log(`[queue] ingesting conversation ${externalId} with ${messages.length} messages`);

  try {
    const result = await pg.transaction(async (tx) => {
      // Upsert conversation by external_id (manual due to missing unique constraint)
      let conv = await tx.query.conversations.findFirst({ where: eq(tConversations.externalId, externalId) });
      if (!conv) {
        const inserted = await tx
          .insert(tConversations)
          .values({ 
            externalId, 
            startedAt, 
            endedAt, 
            status: "completed", 
            metadata: (metadata as any) ?? {} 
          })
          .returning({ id: tConversations.id });
        conv = { id: inserted[0].id } as any;
      } else {
        await tx
          .update(tConversations)
          .set({ 
            startedAt, 
            endedAt, 
            status: "completed", 
            updatedAt: new Date(), 
            metadata: (metadata as any) ?? conv.metadata 
          })
          .where(eq(tConversations.id, conv.id));
      }

      // Insert messages (no dedupe in MVP)
      if (messages.length > 0) {
        await tx.insert(tMessages).values(
          messages.map((m) => ({
            conversationId: conv!.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
            metadata: (m.metadata as any) ?? {},
          })),
        );
      }

      return conv!.id as string;
    });

    console.log(`[queue] ingested conversation ${externalId} -> ${result}`);

    return result;
  } catch (err: any) {
    console.error(`[queue] failed to ingest conversation ${externalId}:`, err);
    throw err;
  }
}
