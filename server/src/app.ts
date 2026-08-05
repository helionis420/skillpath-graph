/**
 * Express app factory — shared by the local Node server and Vercel serverless.
 */
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { apiRouter, notFoundHandler, errorHandler } from "./routes/api.js";

/**
 * Guarantees a JSON response before the platform's function timeout.
 * Without this, any unexpected hang surfaces as an opaque 504 gateway error.
 */
function responseDeadline(ms: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          code: "DATABASE_UNAVAILABLE",
          error: `Request exceeded ${ms}ms without a response. CognoDB may be unreachable from this deployment.`,
        });
      }
    }, ms);

    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));
    next();
  };
}

export function createApp(options?: { mountAtRoot?: boolean; deadlineMs?: number }) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(responseDeadline(options?.deadlineMs ?? 9_000));

  // Primary mount — matches /api/health, /api/stats, …
  app.use("/api", apiRouter);

  // Vercel rewrites may deliver the path as /health instead of /api/health
  if (options?.mountAtRoot) {
    app.use("/", apiRouter);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
