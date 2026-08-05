/**
 * Simulates Vercel rewrites + invocation.
 * Usage: node scripts/verify-vercel-handler.mjs
 */
import http from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const handler = require("../api/index.js");

if (typeof handler !== "function") {
  console.error(`FAIL: export is ${typeof handler}, expected a (req, res) function`);
  process.exit(1);
}

/** Mirror vercel.json: /api/(.*) → /api?__path=$1 */
function toVercelUrl(path) {
  const url = new URL(path, "http://localhost");
  if (!url.pathname.startsWith("/api/")) return path;

  const rest = url.pathname.slice("/api/".length);
  const params = new URLSearchParams(url.search);
  params.set("__path", rest);
  return `/api?${params.toString()}`;
}

const server = http.createServer(handler);

server.listen(0, async () => {
  const { port } = server.address();
  const paths = [
    "/api/diagnostics",
    "/api/health",
    "/api/stats",
    "/api/roles",
    "/api/roles/backend-dev",
    "/api/skills/python",
    "/api/skills/categories",
    "/api/paths/learning?from=python&to=llm-engineering",
  ];
  let failed = false;

  for (const path of paths) {
    const vercelPath = toVercelUrl(path);
    const started = Date.now();
    try {
      const res = await fetch(`http://127.0.0.1:${port}${vercelPath}`);
      const body = await res.text();
      const isJson = body.trimStart().startsWith("{");
      const ok = isJson && res.status < 500;
      console.log(
        `${ok ? "PASS" : "FAIL"} ${path} → HTTP ${res.status} in ${Date.now() - started}ms`
      );
      console.log(`     via ${vercelPath}`);
      console.log(`     ${body.replace(/\s+/g, " ").slice(0, 140)}`);
      if (!ok) failed = true;
    } catch (err) {
      console.log(`FAIL ${path} → ${err.message}`);
      failed = true;
    }
  }

  server.close();
  process.exit(failed ? 1 : 0);
});
