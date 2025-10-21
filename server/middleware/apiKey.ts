import type { Request, Response, NextFunction } from "express";
import { scryptSync, timingSafeEqual } from "crypto";
import { db as pg } from "../db/client";
import { apiKeys as tApiKeys } from "@shared/db/schema";
import { and, eq, isNull } from "drizzle-orm";

// Verify API key from DB (scrypt-hashed), enforce revocation, and update last_used_at
export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const header = (req.headers["x-api-key"] as string | undefined)?.trim();
    if (!header) return res.status(401).json({ message: "Invalid or missing API key" });

    const dot = header.indexOf(".");
    if (dot <= 0) return res.status(401).json({ message: "Invalid API key format" });
    const prefix = header.slice(0, dot);

    const keyRow = await pg.query.apiKeys.findFirst({
      where: and(eq(tApiKeys.prefix, prefix), isNull(tApiKeys.revokedAt)),
    });
    if (!keyRow) return res.status(401).json({ message: "Unauthorized" });

    // Stored format: scrypt$<base64(salt)>$<base64(hash)>
    const parts = (keyRow.keyHash || "").split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return res.status(401).json({ message: "Unauthorized" });
    const salt = Buffer.from(parts[1], "base64");
    const expected = Buffer.from(parts[2], "base64");
    const actual = scryptSync(header, salt, expected.length);
    const ok = expected.length === actual.length && timingSafeEqual(expected, actual);
    if (!ok) return res.status(401).json({ message: "Unauthorized" });

    // Update last_used_at (best-effort)
    try {
      await pg.update(tApiKeys).set({ lastUsedAt: new Date() }).where(eq(tApiKeys.id, keyRow.id));
    } catch {}

    // Attach basic metadata if needed downstream
    (req as any).apiKey = { id: keyRow.id, prefix: keyRow.prefix, name: keyRow.name };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
