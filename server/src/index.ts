import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { config, validateConfig } from "./config.js";
import { apiRouter, notFoundHandler, errorHandler } from "./routes/api.js";
import { closeDriver } from "./db/driver.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", apiRouter);

const clientDist = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) {
    next();
    return;
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const configErrors = validateConfig();
if (configErrors.length > 0) {
  console.warn("⚠ Configuration warnings:");
  configErrors.forEach((e) => console.warn(`  - ${e}`));
  console.warn("  Set variables in .env (see .env.example). API will return 503 for DB calls.");
}

app.listen(config.port, () => {
  console.log(`SkillPath Graph server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

process.on("SIGINT", async () => {
  await closeDriver();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeDriver();
  process.exit(0);
});

export default app;
