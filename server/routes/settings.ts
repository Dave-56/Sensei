import type { Express } from "express";
import { requireAuth } from "../middleware/auth";
import { db } from "../data/mock";

export function registerSettingsRoutes(app: Express) {
  app.get("/api/v1/settings", requireAuth, (_req, res) => {
    res.json(db.settings);
  });

  app.put("/api/v1/settings", requireAuth, (req, res) => {
    db.settings = { ...db.settings, ...(req.body || {}) };
    res.json(db.settings);
  });
}

