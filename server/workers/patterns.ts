import { db as pg } from "../db/client";
import { conversations as tConversations, messages as tMessages, usagePatterns as tPatterns, patternConversations as tPatternConversations } from "@shared/db/schema";
import { eq } from "drizzle-orm";

// Simple pattern detection - looks for common conversation patterns
function detectPatterns(messages: Array<{ role: string; content: string }>): string[] {
  const patterns: string[] = [];
  const fullText = messages.map(m => m.content.toLowerCase()).join(' ');
  
  // Pattern: Greeting
  if (/hello|hi|hey|good morning|good afternoon|good evening/i.test(fullText)) {
    patterns.push('greeting');
  }
  
  // Pattern: Question asking
  const questions = messages.filter(m => m.content.includes('?')).length;
  if (questions >= 3) {
    patterns.push('question-heavy');
  }
  
  // Pattern: Technical discussion
  if (/api|code|function|error|debug|bug|stack/i.test(fullText)) {
    patterns.push('technical');
  }
  
  // Pattern: Request for help
  if (/help|assist|support|problem|issue|stuck|can't|unable/i.test(fullText)) {
    patterns.push('help-request');
  }
  
  // Pattern: Thank you / positive feedback
  if (/thank|thanks|great|awesome|perfect|excellent|good job/i.test(fullText)) {
    patterns.push('positive-feedback');
  }
  
  // Pattern: Clarification needed
  if (/clarify|explain|what do you mean|not clear|confused/i.test(fullText)) {
    patterns.push('clarification-needed');
  }
  
  // Pattern: Long conversation
  if (messages.length > 10) {
    patterns.push('extended-conversation');
  }
  
  return patterns;
}

export async function analyzeConversationPatterns(conversationId: string) {
  console.log(`[queue] analyzing patterns for conversation ${conversationId}`);

  try {
    // Fetch messages
    const msgs = await pg
      .select({ role: tMessages.role, content: tMessages.content })
      .from(tMessages)
      .where(eq(tMessages.conversationId, conversationId));

    if (msgs.length === 0) {
      console.log(`[queue] no messages found for conversation ${conversationId}`);
      return;
    }

    // Detect training patterns
    const detectedPatterns = detectPatterns(msgs);
    
    console.log(`[queue] detected patterns for conversation ${conversationId}:`, detectedPatterns);

    // Store patterns
    for (const patternName of detectedPatterns) {
      // Upsert pattern
      const existingPattern = await pg.query.usagePatterns.findFirst({ 
        where: eq(tPatterns.name, patternName) 
      });
      
      let patternId: string;
      if (existingPattern) {
        patternId = existingPattern.id;
        // Increment count
        await pg.update(tPatterns)
          .set({ 
            count: existingPattern.count + 1,
            lastSeenAt: new Date()
          })
          .where(eq(tPatterns.id, patternId));
      } else {
        const [newPattern] = await pg.insert(tPatterns).values({
          name: patternName,
          description: `Auto-detected pattern: ${patternName}`,
          count: 1,
          lastSeenAt: new Date()
        }).returning({ id: tPatterns.id });
        patternId = newPattern.id;
      }
      
      // Link conversation to pattern
      await pg.insert(tPatternConversations).values({
        patternId,
        conversationId
      }).onConflictDoNothing(); // Ignore if already linked
    }

    console.log(`[queue] stored ${detectedPatterns.length} patterns for conversation ${conversationId}`);
    
    return detectedPatterns;
  } catch (err: any) {
    console.error(`[queue] failed to analyze patterns for conversation ${conversationId}:`, err);
    throw err;
  }
}
