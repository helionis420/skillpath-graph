import express from "express";
import cors from "cors";
// Import compiled JS so Vercel does not fail on TypeScript `.js` path aliases
import { apiRouter, notFoundHandler, errorHandler } from "../server/dist/routes/api.js";

/**
 * Vercel serverless entry for all /api/* routes.
 * Mounted at `/api` and `/` so path rewrites still hit Express routes.
 */
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);
app.use("/", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
