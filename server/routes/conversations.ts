import type { Express } from "express";
import { requireAuth } from "../middleware/auth";
import { db, paginate } from "../data/mock";

export function registerConversationsRoutes(app: Express) {
  app.get("/api/v1/conversations", requireAuth, (req, res) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.page_size as string) ?? "20", 10);
    const item = db.conversations.map((c) => ({
      id: c.id,
      external_id: c.external_id,
      health_score: c.health_score,
      duration_seconds: 60,
      status: c.status,
      updated_at: c.ended_at ?? c.started_at,
    }));
    res.json(paginate(item, page, pageSize));
  });

  app.get("/api/v1/conversations/:id/messages", requireAuth, (req, res) => {
    const conv = db.conversations.find((c) => c.id === req.params.id);
    if (!conv) return res.status(404).json({ message: "Not found" });
    res.json(conv.messages);
  });

  app.get("/api/v1/conversations/:id/health", requireAuth, (req, res) => {
    const conv = db.conversations.find((c) => c.id === req.params.id);
    if (!conv) return res.status(404).json({ message: "Not found" });
    res.json({
      score: conv.health_score,
      breakdown: { completion: -0, sentiment: -10, clarifications: -8, bonuses: +0 },
    });
  });

  app.get("/api/v1/conversations/:id/failures", requireAuth, (req, res) => {
    res.json(db.failures.filter((f) => f.conversation_id === req.params.id));
  });
}

