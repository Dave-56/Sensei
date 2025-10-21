import type { Express, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { db as pg } from "../db/client";
import { appSettings as tAppSettings } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export function registerSettingsRoutes(app: Express) {
  // GET settings (DB-backed, single-row id=1)
  app.get("/api/v1/settings", requireAuth, async (_req: Request, res: Response) => {
    try {
      const row = await pg.query.appSettings.findFirst({ where: eq(tAppSettings.id, 1) });
      // If not found, return sensible defaults without creating
      return res.json(
        row ?? {
          id: 1,
          slack_webhook_url: null,
          alert_thresholds: {},
          updated_at: null,
        },
      );
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to fetch settings" });
    }
  });

  // PUT settings (DB-backed, idempotent upsert of id=1)
  app.put("/api/v1/settings", requireAuth, async (req: Request, res: Response) => {
    const schema = z.object({
      slack_webhook_url: z.string().url().optional().nullable(),
      alert_thresholds: z.record(z.any()).optional(),
    });
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ message: message || "Invalid request" });
    }

    try {
      const now = new Date();
      const updates = {
        slackWebhookUrl: parsed.data.slack_webhook_url ?? null,
        alertThresholds: (parsed.data.alert_thresholds as any) ?? {},
        updatedAt: now,
      };

      // Upsert row with id=1
      const existing = await pg.query.appSettings.findFirst({ where: eq(tAppSettings.id, 1) });
      if (!existing) {
        await pg.insert(tAppSettings).values({ id: 1, ...updates });
      } else {
        await pg.update(tAppSettings).set(updates).where(eq(tAppSettings.id, 1));
      }

      const row = await pg.query.appSettings.findFirst({ where: eq(tAppSettings.id, 1) });
      // Map to API shape
      return res.json({
        id: row?.id ?? 1,
        slack_webhook_url: row?.slackWebhookUrl ?? null,
        alert_thresholds: row?.alertThresholds ?? {},
        updated_at: row?.updatedAt ?? now,
      });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to update settings" });
    }
  });
}
