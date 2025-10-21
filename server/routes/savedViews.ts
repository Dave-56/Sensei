import type { Express, Request, Response } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { db as pg } from "../db/client";
import { savedViews as tSavedViews } from "@shared/db/schema";
import { eq } from "drizzle-orm";

export function registerSavedViewsRoutes(app: Express) {
  const bodySchema = z.object({
    name: z.string().min(1),
    scope: z.enum(["conversations", "failures", "patterns"]),
    config: z.record(z.any()),
  });

  // POST /api/v1/saved-views
  app.post("/api/v1/saved-views", requireAuth, async (req: Request, res: Response) => {
    const parsed = bodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ message: message || "Invalid request" });
    }
    try {
      const now = new Date();
      const inserted = await pg
        .insert(tSavedViews)
        .values({
          name: parsed.data.name,
          scope: parsed.data.scope,
          config: parsed.data.config as any,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: tSavedViews.id, name: tSavedViews.name, scope: tSavedViews.scope, config: tSavedViews.config });
      return res.status(201).json(inserted[0]);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to create saved view" });
    }
  });

  // PUT /api/v1/saved-views/:id
  app.put("/api/v1/saved-views/:id", requireAuth, async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ message: "Invalid ID" });

    const parsed = bodySchema.partial().refine((d) => Object.keys(d).length > 0, {
      message: "At least one field must be provided",
    }).safeParse(req.body ?? {});
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join(", ");
      return res.status(400).json({ message: message || "Invalid request" });
    }
    try {
      const updates: any = { updatedAt: new Date() };
      if (parsed.data.name !== undefined) updates.name = parsed.data.name;
      if (parsed.data.scope !== undefined) updates.scope = parsed.data.scope;
      if (parsed.data.config !== undefined) updates.config = parsed.data.config as any;

      const updated = await pg
        .update(tSavedViews)
        .set(updates)
        .where(eq(tSavedViews.id, id))
        .returning({ id: tSavedViews.id, name: tSavedViews.name, scope: tSavedViews.scope, config: tSavedViews.config });
      if (updated.length === 0) return res.status(404).json({ message: "Not found" });
      return res.json(updated[0]);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to update saved view" });
    }
  });

  // DELETE /api/v1/saved-views/:id
  app.delete("/api/v1/saved-views/:id", requireAuth, async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ message: "Invalid ID" });
    try {
      const deleted = await pg.delete(tSavedViews).where(eq(tSavedViews.id, id)).returning({ id: tSavedViews.id });
      if (deleted.length === 0) return res.status(404).json({ message: "Not found" });
      return res.status(204).end();
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to delete saved view" });
    }
  });
}

