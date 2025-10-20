import type { Express } from "express";
import { requireAuth } from "../middleware/auth";
import { db } from "../data/mock";

export function registerAnalyticsRoutes(app: Express) {
  app.get("/api/v1/analytics/summary", requireAuth, (_req, res) => {
    const total = db.conversations.length;
    const avgHealth = Math.round(
      db.conversations.reduce((a, c) => a + (c.health_score ?? 0), 0) / Math.max(1, total),
    );
    const failuresToday = db.failures.filter(() => true).length;
    res.json({
      health_score_avg_7d: avgHealth,
      active_conversations: Math.floor(total / 2),
      failures_today: failuresToday,
      volume_trend: [60, 70, 55, 80, 75, 90, 85],
    });
  });

  app.get("/api/v1/analytics/patterns", requireAuth, (_req, res) => {
    res.json([
      { id: "p1", pattern_name: "Reset Password", occurrence_count: 32, trend: "+8%", spark: [2, 3, 5, 8, 13, 21] },
      { id: "p2", pattern_name: "Export Data", occurrence_count: 18, trend: "-3%", spark: [5, 4, 4, 3, 3, 2] },
    ]);
  });

  app.get("/api/v1/analytics/failures/trends", requireAuth, (_req, res) => {
    res.json({
      bucket: "day",
      series: [
        { type: "loop", points: [1, 2, 1, 0, 2, 1, 3] },
        { type: "frustration", points: [0, 1, 1, 1, 2, 1, 1] },
      ],
    });
  });
}

