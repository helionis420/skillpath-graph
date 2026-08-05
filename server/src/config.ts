import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from project root (works locally; Vercel injects env vars directly)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

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
