import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Verify Supabase JWT using SUPABASE_JWT_SECRET. In development, if the secret
// is not set, allow requests and attach a mock user to avoid blocking the mock UI.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  const header = (req.headers["authorization"] || req.headers["Authorization" as any]) as string | undefined;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!secret) {
    // Dev fallback: no secret configured, keep existing permissive behavior
    req.user = { id: "admin", email: "admin@example.com" };
    return next();
  }

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, secret) as any;
    // Supabase JWT usually has sub as user id and email claim
    const id = payload.sub as string | undefined;
    const email = (payload.email as string | undefined) || "";
    if (!id) return res.status(401).json({ message: "Unauthorized" });
    req.user = { id, email };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}
