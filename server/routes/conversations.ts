import type { Express, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { db as pg } from "../db/client";
import {
  conversations as tConversations,
  messages as tMessages,
  failures as tFailures,
  patternConversations as tPatternConversations,
} from "@shared/db/schema";
import { and, asc, desc, eq, gte, lte, isNotNull, exists, sql } from "drizzle-orm";
import { z } from "zod";
import { paginationSchema, parseQuery } from "../lib/validation";

export function registerConversationsRoutes(app: Express) {
  // GET /api/v1/conversations (DB-backed)
  app.get("/api/v1/conversations", requireAuth, async (req: Request, res: Response) => {
    try {
      const querySchema = paginationSchema.extend({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        health_min: z.coerce.number().optional(),
        health_max: z.coerce.number().optional(),
        has_failures: z
          .union([z.string().transform((v) => v === "true"), z.boolean()])
          .optional(),
        pattern_id: z.string().uuid().optional(),
      });
      const q = parseQuery(querySchema, req.query);

      const whereClauses = [] as any[];
      if (q.from) whereClauses.push(gte(tConversations.startedAt, new Date(q.from)));
      if (q.to) whereClauses.push(lte(tConversations.startedAt, new Date(q.to)));
      if (q.health_min !== undefined) whereClauses.push(gte(tConversations.healthScore, q.health_min));
      if (q.health_max !== undefined) whereClauses.push(lte(tConversations.healthScore, q.health_max));

      // Optional filter: has_failures
      if (q.has_failures === true) {
        whereClauses.push(
          exists(
            pg
              .select({ one: sql`1` })
              .from(tFailures)
              .where(eq(tFailures.conversationId, tConversations.id)),
          ),
        );
      } else if (q.has_failures === false) {
        whereClauses.push(
          sql`NOT EXISTS (${pg
            .select({ one: sql`1` })
            .from(tFailures)
            .where(eq(tFailures.conversationId, tConversations.id))})`,
        );
      }

      // Optional filter: pattern_id
      if (q.pattern_id) {
        whereClauses.push(
          exists(
            pg
              .select({ one: sql`1` })
              .from(tPatternConversations)
              .where(
                and(
                  eq(tPatternConversations.patternId, q.pattern_id),
                  eq(tPatternConversations.conversationId, tConversations.id),
                ),
              ),
          ),
        );
      }

      const where = whereClauses.length ? and(...whereClauses) : undefined;

      // Total count
      const [{ count }] = (await pg
        .select({ count: sql<number>`cast(count(${tConversations.id}) as int)` })
        .from(tConversations)
        .where(where)) as { count: number }[];

      const offset = (q.page - 1) * q.page_size;

      // Select page
      const rows = await pg
        .select({
          id: tConversations.id,
          external_id: tConversations.externalId,
          health_score: tConversations.healthScore,
          status: tConversations.status,
          updated_at: sql<string>`coalesce(${tConversations.endedAt}, ${tConversations.startedAt})` as any,
          duration_seconds: sql<number>`coalesce(extract(epoch from (${tConversations.endedAt} - ${tConversations.startedAt})), 0)::int` as any,
        })
        .from(tConversations)
        .where(where)
        .orderBy(desc(sql`coalesce(${tConversations.endedAt}, ${tConversations.startedAt})`))
        .limit(q.page_size)
        .offset(offset);

      res.json({
        items: rows,
        total: count,
        page: q.page,
        pageSize: q.page_size,
        totalPages: Math.ceil(count / q.page_size),
      });
    } catch (err: any) {
      const status = err.status || 500;
      return res.status(status).json({ message: err.message || "Failed to fetch conversations" });
    }
  });

  // GET /api/v1/conversations/:id/messages (DB-backed)
  app.get("/api/v1/conversations/:id/messages", requireAuth, async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ message: "Invalid ID" });
    try {
      // Ensure conversation exists
      const conv = await pg.query.conversations.findFirst({ where: eq(tConversations.id, id) });
      if (!conv) return res.status(404).json({ message: "Not found" });

      const rows = await pg
        .select({
          id: tMessages.id,
          role: tMessages.role,
          content: tMessages.content,
          timestamp: tMessages.timestamp,
          sentiment_score: tMessages.sentimentScore,
        })
        .from(tMessages)
        .where(eq(tMessages.conversationId, id))
        .orderBy(asc(tMessages.timestamp));
      res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || "Failed to fetch messages" });
    }
  });

  // GET /api/v1/conversations/:id/health (DB-backed)
  app.get("/api/v1/conversations/:id/health", requireAuth, async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ message: "Invalid ID" });
    try {
      const conv = await pg.query.conversations.findFirst({ where: eq(tConversations.id, id) });
      if (!conv) return res.status(404).json({ message: "Not found" });

      const msgs = await pg
        .select({ role: tMessages.role, content: tMessages.content, sentiment: tMessages.sentimentScore })
        .from(tMessages)
        .where(eq(tMessages.conversationId, id))
        .orderBy(asc(tMessages.timestamp));

      // Simple health breakdown heuristic aligned with backend-architecture
      const userMsgs = msgs.filter((m) => m.role === "user");
      const sentimentShift =
        userMsgs.length >= 2 && userMsgs[0].sentiment !== null && userMsgs[userMsgs.length - 1].sentiment !== null
          ? (userMsgs[userMsgs.length - 1].sentiment || 0) - (userMsgs[0].sentiment || 0)
          : 0;
      const clarificationPatterns = [/that's not/i, /I meant/i, /not what/i, /try again/i, /doesn't work/i];
      const clarifications = msgs.filter((m) => clarificationPatterns.some((p) => p.test(m.content))).length;
      const hasThanks = userMsgs.some((m) => /thank(s| you)/i.test(m.content));

      const breakdown = {
        completion: conv.endedAt ? 0 : -30,
        sentiment: sentimentShift < -0.5 ? -20 : 0,
        clarifications: -10 * Math.min(clarifications, 3),
        bonuses: hasThanks ? 10 : 0,
      };

      const score = conv.healthScore ?? Math.max(0, 100 + breakdown.completion + breakdown.sentiment + breakdown.clarifications + breakdown.bonuses);

      res.json({ score, breakdown });
    } catch (err: any) {
      return res.status(500).json({ message: err.message || "Failed to compute health" });
    }
  });

  // GET /api/v1/conversations/:id/failures (DB-backed)
  app.get("/api/v1/conversations/:id/failures", requireAuth, async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ message: "Invalid ID" });
    try {
      const rows = await pg
        .select({
          id: tFailures.id,
          conversation_id: tFailures.conversationId,
          type: tFailures.type,
          detected_at: tFailures.detectedAt,
          status: tFailures.status,
          updated_at: tFailures.updatedAt,
        })
        .from(tFailures)
        .where(eq(tFailures.conversationId, id))
        .orderBy(desc(tFailures.detectedAt));
      res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ message: err.message || "Failed to fetch failures" });
    }
  });
}
