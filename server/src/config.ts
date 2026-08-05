import dotenv from "dotenv";
import fs from "fs";
import path from "path";

/**
 * Load .env for local dev.
 * - `npm run dev -w server` runs with cwd = server/, so root .env is at ../.env
 * - Vercel injects env vars; missing .env files are ignored
 */
function loadEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../.env"),
    path.resolve(process.cwd(), "../../.env"),
  ];

  for (const envPath of candidates) {
    try {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        return;
      }
    } catch {
      // ignore (e.g. restricted FS on serverless)
    }
  }

  dotenv.config();
}

loadEnv();

export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  cognodb: {
    uri: process.env.COGNODB_URI ?? "",
    username: process.env.COGNODB_USERNAME ?? "cognodb",
    password: process.env.COGNODB_PASSWORD ?? "",
  },
};

export function validateConfig(): string[] {
  const errors: string[] = [];
  if (!config.cognodb.uri) {
    errors.push("COGNODB_URI is not set");
  }
  if (!config.cognodb.password) {
    errors.push("COGNODB_PASSWORD is not set");
  }
  return errors;
}
