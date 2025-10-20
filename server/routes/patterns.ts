import type { Express } from "express";
import { requireAuth } from "../middleware/auth";
import { db, paginate } from "../data/mock";

export function registerPatternsRoutes(app: Express) {
  app.get("/api/v1/patterns/:id/conversations", requireAuth, (req, res) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.page_size as string) ?? "20", 10);
    const items = db.conversations
      .slice(0, 10)
      .map((c) => ({ id: c.id, external_id: c.external_id, health_score: c.health_score }));
    res.json(paginate(items, page, pageSize));
  });
}

