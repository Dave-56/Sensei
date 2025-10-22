import type { Express, Request, Response } from "express";
import { requireApiKey } from "../middleware/apiKey";
import { z } from "zod";
import { addIngestConversationJob } from "../queue";

export function registerIngestionRoutes(app: Express) {
  // POST /api/v1/conversations/track (DB-backed)
  app.post("/api/v1/conversations/track", requireApiKey, async (req: Request, res: Response) => {
    const msgSchema = z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1),
      timestamp: z.string().datetime(),
      metadata: z.record(z.any()).optional(),
    });
    const bodySchema = z.object({
      conversationId: z.string().min(1), // external id from client
      messages: z.array(msgSchema).min(1),
      metadata: z.record(z.any()).optional(),
    });

    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ message: message || "Invalid request" });
    }

    const { conversationId: externalId, messages, metadata } = parsed.data;

    try {
      // Enqueue ingestion job (or inline fallback)
      await addIngestConversationJob({
        conversationId: externalId,
        messages,
        metadata
      });
      
      return res.status(201).json({ id: externalId });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to track conversation" });
    }
  });
}
