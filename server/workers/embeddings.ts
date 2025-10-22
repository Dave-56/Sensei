import { db as pg } from "../db/client";
import { conversations as tConversations, messages as tMessages, conversationEmbeddings as tEmbeddings } from "@shared/db/schema";
import { eq } from "drizzle-orm";

// Simple embedding function - in production you'd use OpenAI embeddings or similar
function generateSimpleEmbedding(text: string): number[] {
  // This is a very basic "embedding" - just normalized word frequency
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const wordCounts: Record<string, number> = {};
  
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  // Create a simple 50-dimensional vector based on word frequencies
  const embedding = new Array(50).fill(0);
  const uniqueWords = Object.keys(wordCounts);
  
  uniqueWords.forEach((word, index) => {
    const hash = word.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const dim = hash % 50;
    embedding[dim] += wordCounts[word] / words.length;
  });
  
  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

export async function embedConversation(conversationId: string) {
  console.log(`[queue] embedding conversation ${conversationId}`);

  try {
    // Fetch conversation and messages
    const conv = await pg.query.conversations.findFirst({ where: eq(tConversations.id, conversationId) });
    if (!conv) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const msgs = await pg
      .select({ content: tMessages.content, role: tMessages.role })
      .from(tMessages)
      .where(eq(tMessages.conversationId, conversationId));

    // Combine all message content
    const fullText = msgs.map(m => `${m.role}: ${m.content}`).join('\n');
    
    // Generate embedding
    const embedding = generateSimpleEmbedding(fullText);

    // Store embedding
    await pg.insert(tEmbeddings).values({
      conversationId,
      embedding: JSON.stringify(embedding),
      model: 'simple-v1',
      createdAt: new Date()
    }).onConflictDoUpdate({
      target: [tEmbeddings.conversationId],
      set: {
        embedding: JSON.stringify(embedding),
        model: 'simple-v1',
        createdAt: new Date()
      }
    });

    console.log(`[queue] embedded conversation ${conversationId} (${embedding.length} dimensions)`);
    
    return embedding;
  } catch (err: any) {
    console.error(`[queue] failed to embed conversation ${conversationId}:`, err);
    throw err;
  }
}
