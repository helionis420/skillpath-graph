/**
 * Simulates a Vercel invocation: Vercel calls the exported handler as (req, res).
 * Usage: node scripts/verify-vercel-handler.mjs
 */
import http from "http";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const handler = require("../api/[...path].js");

if (typeof handler !== "function") {
  console.error(`FAIL: export is ${typeof handler}, expected a (req, res) function`);
  process.exit(1);
}

const server = http.createServer(handler);

server.listen(0, async () => {
  const { port } = server.address();
  const paths = ["/api/diagnostics", "/api/health", "/api/stats"];
  let failed = false;

  for (const path of paths) {
    const started = Date.now();
    try {
      const res = await fetch(`http://127.0.0.1:${port}${path}`);
      const body = await res.text();
      const isJson = body.trimStart().startsWith("{");
      console.log(`${isJson ? "PASS" : "FAIL"} ${path} → HTTP ${res.status} in ${Date.now() - started}ms`);
      console.log(`     ${body.replace(/\s+/g, " ").slice(0, 160)}`);
      if (!isJson) failed = true;
    } catch (err) {
      console.log(`FAIL ${path} → ${err.message}`);
      failed = true;
    }
  }

  server.close();
  process.exit(failed ? 1 : 0);
});
