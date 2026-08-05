/**
 * Express app factory — shared by local Node server and Vercel serverless.
 */
import express from "express";
import cors from "cors";
import { apiRouter, notFoundHandler, errorHandler } from "./routes/api.js";

export function createApp(options?: { mountAtRoot?: boolean }) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Primary mount — matches /api/health, /api/stats, …
  app.use("/api", apiRouter);

  // Vercel catch-all / rewrite may deliver path as /health instead of /api/health
  if (options?.mountAtRoot) {
    app.use("/", apiRouter);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
