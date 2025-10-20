import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import { requireApiKey } from "../middleware/apiKey";
import { db } from "../data/mock";

export function registerIngestionRoutes(app: Express) {
  app.post("/api/v1/conversations/track", requireApiKey, (req: Request, res: Response) => {
    const body = req.body as any;
    const id = randomUUID();
    const now = new Date().toISOString();
    db.conversations.unshift({
      id,
      external_id: body?.conversationId ?? id,
      started_at: now,
      ended_at: now,
      health_score: 82,
      status: "completed",
      messages: body?.messages ?? [],
    });
    res.status(201).json({ id });
  });
}

