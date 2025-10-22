import { db as pg } from "../db/client";
import { appSettings as tAppSettings } from "@shared/db/schema";
import { eq } from "drizzle-orm";

type SlackPayload = {
  text?: string;
  blocks?: any[];
};

let cachedUrl: { url: string | null; expiresAt: number } = { url: null, expiresAt: 0 };
const CACHE_TTL_MS = 60_000;

async function getWebhookUrl(): Promise<string | null> {
  const now = Date.now();
  if (cachedUrl.expiresAt > now) return cachedUrl.url;

  // Prefer DB setting (app_settings.id = 1)
  try {
    const row = await pg.query.appSettings.findFirst({ where: eq(tAppSettings.id, 1 as any) });
    const dbUrl = (row?.slackWebhookUrl || null) as string | null;
    cachedUrl = { url: dbUrl ?? process.env.SLACK_WEBHOOK_URL ?? null, expiresAt: now + CACHE_TTL_MS };
    return cachedUrl.url;
  } catch {
    // Fallback to env var
    cachedUrl = { url: process.env.SLACK_WEBHOOK_URL ?? null, expiresAt: now + CACHE_TTL_MS };
    return cachedUrl.url;
  }
}

export async function sendSlackMessage(payload: SlackPayload): Promise<boolean> {
  const url = await getWebhookUrl();
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function dashboardBaseUrl() {
  // Best-effort: prefer BASE_URL; otherwise derive from PORT
  const base = process.env.BASE_URL?.replace(/\/$/, "");
  if (base) return base;
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

export async function alertFailure(opts: { conversationId: string; type: string }) {
  const { conversationId, type } = opts;
  const url = `${dashboardBaseUrl()}/conversations`;
  const text = `:rotating_light: New failure detected: ${type} (conversation ${conversationId})`;
  return sendSlackMessage({ text, blocks: [
    { type: "section", text: { type: "mrkdwn", text: `*New failure* • *${type}*` } },
    { type: "context", elements: [ { type: "mrkdwn", text: `Conversation: ${conversationId}` } ] },
    { type: "actions", elements: [ { type: "button", text: { type: "plain_text", text: "View conversations" }, url } ] },
  ]});
}

export async function alertLowHealth(opts: { conversationId: string; score: number }) {
  const { conversationId, score } = opts;
  // TODO: in future, read threshold from app_settings.alert_thresholds
  const threshold = 40;
  if (score >= threshold) return true;
  const url = `${dashboardBaseUrl()}/conversations`;
  const text = `:thermometer: Low conversation health: ${score} (conversation ${conversationId})`;
  return sendSlackMessage({ text, blocks: [
    { type: "section", text: { type: "mrkdwn", text: `*Low health* • Score: *${score}* (< ${threshold})` } },
    { type: "context", elements: [ { type: "mrkdwn", text: `Conversation: ${conversationId}` } ] },
    { type: "actions", elements: [ { type: "button", text: { type: "plain_text", text: "View conversations" }, url } ] },
  ]});
}

