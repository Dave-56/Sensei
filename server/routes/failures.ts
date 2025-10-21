import type { Express, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { db as pg } from "../db/client";
import { failures as tFailures } from "@shared/db/schema";
import { desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
// no mock usage; fully DB-backed now

export function registerFailuresRoutes(app: Express) {
  // GET /api/v1/failures (DB-backed, paginated)
  app.get("/api/v1/failures", requireAuth, async (req: Request, res: Response) => {
    try {
      const page = parseInt((req.query.page as string) ?? "1", 10);
      const pageSize = parseInt((req.query.page_size as string) ?? "20", 10);
      const offset = (page - 1) * pageSize;

      const [{ total }] = (await pg
        .select({ total: sql<number>`cast(count(${tFailures.id}) as int)` })
        .from(tFailures)) as { total: number }[];

      const items = (await pg
        .select({
          id: tFailures.id,
          conversation_id: tFailures.conversationId,
          type: tFailures.type,
          detected_at: tFailures.detectedAt,
          status: tFailures.status,
        })
        .from(tFailures)
        .orderBy(desc(tFailures.detectedAt))
        .limit(pageSize)
        .offset(offset)) as any[];

      return res.json({
        items,
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to fetch failures" });
    }
  });

  // GET /api/v1/failures/board (DB-backed, unresolved grouped by type)
  app.get("/api/v1/failures/board", requireAuth, async (_req: Request, res: Response) => {
    try {
      const rows = (await pg
        .select({
          id: tFailures.id,
          conversation_id: tFailures.conversationId,
          type: tFailures.type,
          detected_at: tFailures.detectedAt,
          status: tFailures.status,
        })
        .from(tFailures)
        .where(ne(tFailures.status, "resolved"))) as { id: string; conversation_id: string; type: string; detected_at: Date; status: string }[];

      const columns = ["loop", "frustration", "nonsense", "abrupt_end"] as const;
      const board: Record<(typeof columns)[number], typeof rows> = {
        loop: [],
        frustration: [],
        nonsense: [],
        abrupt_end: [],
      };
      for (const r of rows) {
        const t = r.type as (typeof columns)[number];
        if (columns.includes(t)) board[t].push(r);
      }
      return res.json(board);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to fetch failures board" });
    }
  });

  // PATCH status (DB-backed)
  app.patch("/api/v1/failures/:id", requireAuth, async (req: Request, res: Response) => {
    const id = req.params.id;
    const idOk = z.string().uuid().safeParse(id).success;
    if (!idOk) return res.status(400).json({ message: "Invalid ID" });

    const bodySchema = z.object({ status: z.enum(["open", "ack", "resolved"]) });
    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ message: message || "Invalid request" });
    }

    try {
      const now = new Date();
      const status = parsed.data.status;
      const updates: any = { status, updatedAt: now };
      if (status === "resolved") {
        updates.resolvedAt = now;
      } else {
        updates.resolvedAt = null;
      }

      const result = await pg.update(tFailures).set(updates).where(eq(tFailures.id, id)).returning({
        id: tFailures.id,
        conversation_id: tFailures.conversationId,
        type: tFailures.type,
        detected_at: tFailures.detectedAt,
        status: tFailures.status,
        updated_at: tFailures.updatedAt,
        resolved_at: tFailures.resolvedAt,
      });
      if (!result || result.length === 0) return res.status(404).json({ message: "Not found" });
      return res.json(result[0]);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to update failure" });
    }
  });
}
