import type { Express } from "express";
import { createServer, type Server } from "http";
import { registerHealthRoutes } from "./routes/health";
import { registerIngestionRoutes } from "./routes/ingestion";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerConversationsRoutes } from "./routes/conversations";
import { registerPatternsRoutes } from "./routes/patterns";
import { registerFailuresRoutes } from "./routes/failures";
import { registerSettingsRoutes } from "./routes/settings";
import { registerApiKeysRoutes } from "./routes/apiKeys";
import { registerSavedViewsRoutes } from "./routes/savedViews";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register domain routes
  registerHealthRoutes(app);
  registerIngestionRoutes(app);
  registerAnalyticsRoutes(app);
  registerConversationsRoutes(app);
  registerPatternsRoutes(app);
  registerFailuresRoutes(app);
  registerSettingsRoutes(app);
  registerApiKeysRoutes(app);
  registerSavedViewsRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
