import express from "express";
import cors from "cors";
import { apiRouter, notFoundHandler, errorHandler } from "./routes/api.js";

/** Express app for API routes — used by local server and Vercel serverless. */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
