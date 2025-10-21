import type { Express, Request, Response } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { requireAuth } from "../middleware/auth";
import { db as pg } from "../db/client";
import { apiKeys as tApiKeys } from "@shared/db/schema";
import { eq } from "drizzle-orm";

export function registerApiKeysRoutes(app: Express) {
  // List API keys (metadata only)
  app.get("/api/v1/api-keys", requireAuth, async (_req: Request, res: Response) => {
    try {
      const rows = await pg
        .select({
          id: tApiKeys.id,
          name: tApiKeys.name,
          prefix: tApiKeys.prefix,
          created_at: tApiKeys.createdAt,
          last_used_at: tApiKeys.lastUsedAt,
          revoked_at: tApiKeys.revokedAt,
        })
        .from(tApiKeys);
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to list API keys" });
    }
  });

  // Create an API key (returns one-time secret, stores hash)
  app.post("/api/v1/api-keys", requireAuth, async (req: Request, res: Response) => {
    try {
      const name = (req.body?.name as string) || "New Key";
      const prefix = `sk_${randomBytes(6).toString("hex")}`; // 12 hex chars
      const secret = randomBytes(24).toString("base64url"); // one-time secret
      const apiKey = `${prefix}.${secret}`;

      // scrypt hash with random salt; store as scrypt$base64(salt)$base64(hash)
      const salt = randomBytes(16);
      const hash = scryptSync(apiKey, salt, 64);
      const keyHash = `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;

      const inserted = await pg
        .insert(tApiKeys)
        .values({ name, prefix, keyHash })
        .returning({ id: tApiKeys.id });

      return res.status(201).json({ id: inserted[0].id, api_key: apiKey, prefix, name });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to create API key" });
    }
  });

  // Revoke an API key (soft delete)
  app.delete("/api/v1/api-keys/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      await pg.update(tApiKeys).set({ revokedAt: new Date() }).where(eq(tApiKeys.id, id));
      return res.status(204).end();
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Failed to revoke API key" });
    }
  });
}
