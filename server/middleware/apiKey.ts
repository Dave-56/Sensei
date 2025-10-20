import type { Request, Response, NextFunction } from "express";

// Simple API key check for ingestion endpoints. Later: check DB-stored hashed keys.
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["x-api-key"] as string | undefined;
  const envKey = process.env.INGEST_API_KEY;

  if (!header || !envKey || header !== envKey) {
    return res.status(401).json({ message: "Invalid or missing API key" });
  }

  next();
}

