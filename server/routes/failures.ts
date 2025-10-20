import type { Express } from "express";
import { requireAuth } from "../middleware/auth";
import { db, paginate } from "../data/mock";

export function registerFailuresRoutes(app: Express) {
  app.get("/api/v1/failures", requireAuth, (req, res) => {
    const page = parseInt((req.query.page as string) ?? "1", 10);
    const pageSize = parseInt((req.query.page_size as string) ?? "20", 10);
    res.json(paginate(db.failures, page, pageSize));
  });

  app.get("/api/v1/failures/board", requireAuth, (_req, res) => {
    const columns = ["loop", "frustration", "nonsense", "abrupt_end"] as const;
    const board = Object.fromEntries(
      columns.map((col) => [col, db.failures.filter((f) => f.type === col && f.status !== "resolved")]),
    );
    res.json(board);
  });

  app.patch("/api/v1/failures/:id", requireAuth, (req, res) => {
    const f = db.failures.find((x) => x.id === req.params.id);
    if (!f) return res.status(404).json({ message: "Not found" });
    const status = (req.body?.status as any) ?? f.status;
    f.status = status;
    res.json(f);
  });
}

