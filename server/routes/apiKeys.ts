import type { Express } from "express";
import { randomUUID } from "crypto";
import { requireAuth } from "../middleware/auth";
import { db } from "../data/mock";

export function registerApiKeysRoutes(app: Express) {
  app.get("/api/v1/api-keys", requireAuth, (_req, res) => {
    res.json(db.apiKeys);
  });

  app.post("/api/v1/api-keys", requireAuth, (req, res) => {
    const id = randomUUID();
    db.apiKeys.push({ id, name: req.body?.name ?? "New Key", prefix: "sk_", created_at: new Date().toISOString() });
    res.status(201).json({ id });
  });

  app.delete("/api/v1/api-keys/:id", requireAuth, (req, res) => {
    const idx = db.apiKeys.findIndex((k) => k.id === req.params.id);
    if (idx >= 0) db.apiKeys.splice(idx, 1);
    res.status(204).end();
  });
}

