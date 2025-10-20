import type { Express, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { requireAuth } from "../middleware/auth";

export function registerHealthRoutes(app: Express) {
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  app.get("/api/v1/health/db", async (_req: Request, res: Response) => {
    try {
      const result = await db.execute(sql`select 1 as ok`);
      res.json({ ok: true, db: result.rows?.[0]?.ok === 1 });
    } catch (err: any) {
      res.status(500).json({ ok: false, message: err?.message || "DB error" });
    }
  });

  // Test route that requires authentication
  app.get("/api/v1/test-auth", requireAuth, (req: Request, res: Response) => {
    res.json({ 
      ok: true, 
      message: "Authentication successful", 
      user: req.user 
    });
  });
}
