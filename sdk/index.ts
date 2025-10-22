export type SenseiInit = {
  apiKey: string;
  baseUrl: string;
  environment?: "dev" | "prod";
  batch?: { size?: number; intervalMs?: number };
};

export type SenseiMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date | string | number;
  metadata?: Record<string, unknown>;
};

export type TrackPayload = {
  conversationId: string;
  messages: SenseiMessage[];
  metadata?: Record<string, unknown>;
};

export class SenseiSDK {
  private apiKey: string;
  private baseUrl: string;
  private queue: TrackPayload[] = [];
  private timer?: any;
  private batchSize: number;
  private intervalMs: number;

  constructor(cfg: SenseiInit) {
    this.apiKey = cfg.apiKey;
    this.baseUrl = cfg.baseUrl.replace(/\/$/, "");
    this.batchSize = cfg.batch?.size ?? 1;
    this.intervalMs = cfg.batch?.intervalMs ?? 2000;
    if (this.batchSize > 1) this.startTimer();
    // try to flush on unload in browsers
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        try {
          this.flush({ beacon: true }).catch(() => {});
        } catch {}
      });
    }
  }

  static init(cfg: SenseiInit) {
    return new SenseiSDK(cfg);
  }

  async track(payload: TrackPayload) {
    // Normalize timestamps to ISO strings
    const norm: TrackPayload = {
      conversationId: payload.conversationId,
      metadata: payload.metadata,
      messages: payload.messages.map((m) => ({
        role: m.role,
        content: m.content,
        metadata: m.metadata,
        timestamp: this.normalizeTime(m.timestamp),
      })),
    };

    if (this.batchSize > 1) {
      this.queue.push(norm);
      if (this.queue.length >= this.batchSize) await this.flush();
      return;
    }

    await this.sendOne(norm);
  }

  async flush(opts?: { beacon?: boolean }) {
    if (this.queue.length === 0) return;
    const items = this.queue.splice(0, this.queue.length);
    // For MVP, send individually to keep server API simple
    if (opts?.beacon && typeof navigator !== "undefined" && (navigator as any).sendBeacon) {
      for (const p of items) this.sendBeacon(p);
      return;
    }
    await Promise.all(items.map((p) => this.sendOne(p).catch(() => {})));
  }

  private startTimer() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.flush().catch(() => {});
    }, this.intervalMs);
  }

  private normalizeTime(t?: Date | string | number) {
    const d = t instanceof Date ? t : typeof t === "number" ? new Date(t) : t ? new Date(t) : new Date();
    return d.toISOString();
  }

  private async sendOne(p: TrackPayload) {
    const url = `${this.baseUrl}/api/v1/conversations/track`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
      },
      body: JSON.stringify(p),
      keepalive: true,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Ingest failed: ${res.status} ${text}`);
    }
  }

  private sendBeacon(p: TrackPayload) {
    try {
      const url = `${this.baseUrl}/api/v1/conversations/track`;
      const blob = new Blob([JSON.stringify(p)], { type: "application/json" });
      (navigator as any).sendBeacon(url, blob);
    } catch {}
  }
}

export const Sensei = SenseiSDK;

