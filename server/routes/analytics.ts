import type { Express, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { db as pg } from "../db/client";
import { conversations as tConversations, failures as tFailures, usagePatterns as tPatterns } from "@shared/db/schema";
import { and, between, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { parseQuery } from "../lib/validation";

export function registerAnalyticsRoutes(app: Express) {
  // GET /api/v1/analytics/summary (DB-backed)
  app.get("/api/v1/analytics/summary", requireAuth, async (req: Request, res: Response) => {
    try {
      const schema = z.object({ timeframe: z.enum(["24h", "7d", "30d"]).default("7d") });
      const { timeframe } = parseQuery(schema, req.query);
      const now = new Date();
      const from = new Date(
        timeframe === "24h" ? now.getTime() - 24 * 3600_000 : timeframe === "7d" ? now.getTime() - 7 * 86400_000 : now.getTime() - 30 * 86400_000,
      );

      // Average health over timeframe
      const [{ avg }] = (await pg
        .select({ avg: sql<number>`coalesce(cast(avg(${tConversations.healthScore}) as int), 0)` })
        .from(tConversations)
        .where(and(gte(tConversations.startedAt, from), lte(tConversations.startedAt, now)))) as { avg: number }[];

      // Active conversations: started in timeframe and not ended
      const [{ active }] = (await pg
        .select({ active: sql<number>`cast(count(${tConversations.id}) as int)` })
        .from(tConversations)
        .where(and(gte(tConversations.startedAt, from), lte(tConversations.startedAt, now), sql`(${tConversations.endedAt}) IS NULL`))) as {
        active: number;
      }[];

      // Failures in last 24h (or within timeframe if 24h)
      const failuresFrom = timeframe === "24h" ? new Date(now.getTime() - 24 * 3600_000) : from;
      const [{ fcount }] = (await pg
        .select({ fcount: sql<number>`cast(count(${tFailures.id}) as int)` })
        .from(tFailures)
        .where(and(gte(tFailures.detectedAt, failuresFrom), lte(tFailures.detectedAt, now)))) as { fcount: number }[];

      // Volume trend: last 7 days counts
      const days = 7;
      const trendFrom = new Date(now.getTime() - (days - 1) * 86400_000);
      const rows = (await pg
        .select({
          day: sql<string>`to_char(date_trunc('day', ${tConversations.startedAt}), 'YYYY-MM-DD')`,
          count: sql<number>`cast(count(${tConversations.id}) as int)`,
        })
        .from(tConversations)
        .where(and(gte(tConversations.startedAt, trendFrom), lte(tConversations.startedAt, now)))
        .groupBy(sql`date_trunc('day', ${tConversations.startedAt})`)
        .orderBy(desc(sql`date_trunc('day', ${tConversations.startedAt})`))) as { day: string; count: number }[];

      // Build array for last 7 days in order oldest->newest
      const counts: number[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400_000);
        const key = d.toISOString().slice(0, 10);
        counts.push(rows.find((r) => r.day === key)?.count ?? 0);
      }

      res.json({ health_score_avg_7d: avg, active_conversations: active, failures_today: fcount, volume_trend: counts });
    } catch (err: any) {
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Failed to fetch summary" });
    }
  });

  // GET /api/v1/analytics/patterns (DB-backed)
  app.get("/api/v1/analytics/patterns", requireAuth, async (_req: Request, res: Response) => {
    try {
      const rows = await pg
        .select({ id: tPatterns.id, pattern_name: tPatterns.patternName, occurrence_count: tPatterns.occurrenceCount })
        .from(tPatterns)
        .orderBy(desc(tPatterns.occurrenceCount))
        .limit(10);
      res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || "Failed to fetch patterns" });
    }
  });

  // GET /api/v1/analytics/failures/trends (DB-backed)
  app.get("/api/v1/analytics/failures/trends", requireAuth, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        bucket: z.enum(["day"]).default("day"),
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      });
      const q = parseQuery(schema, req.query);
      const now = q.to ? new Date(q.to) : new Date();
      const from = q.from ? new Date(q.from) : new Date(now.getTime() - 6 * 86400_000); // default last 7 days

      const rows = (await pg
        .select({
          bucket: sql<string>`to_char(date_trunc('day', ${tFailures.detectedAt}), 'YYYY-MM-DD')`,
          type: tFailures.type,
          count: sql<number>`cast(count(${tFailures.id}) as int)`,
        })
        .from(tFailures)
        .where(and(gte(tFailures.detectedAt, from), lte(tFailures.detectedAt, now)))
        .groupBy(sql`date_trunc('day', ${tFailures.detectedAt})`, tFailures.type)
        .orderBy(desc(sql`date_trunc('day', ${tFailures.detectedAt})`))) as { bucket: string; type: string; count: number }[];

      // Build per-type series
      const types = Array.from(new Set(rows.map((r) => r.type)));
      const days = Math.round((now.getTime() - from.getTime()) / 86400_000) + 1;
      const labels: string[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400_000);
        labels.push(d.toISOString().slice(0, 10));
      }
      const series = types.map((type) => ({
        type,
        points: labels.map((day) => rows.find((r) => r.type === type && r.bucket === day)?.count ?? 0),
      }));

      res.json({ bucket: q.bucket, series });
    } catch (err: any) {
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Failed to fetch failure trends" });
    }
  });
}
