/**
 * Bundled by esbuild → api/bundle.cjs (CommonJS).
 *
 * vercel.json rewrites every /api/* request to /api?__path=<rest>, so nested
 * routes like /api/roles/:id always reach this single function. The wrapper
 * rebuilds the original URL before Express matches routes.
 */
import dns from "dns";
import type { IncomingMessage, ServerResponse } from "http";
import { createApp } from "../server/src/app";

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older runtimes without this API
}

const app = createApp({ mountAtRoot: true });

/**
 * Rebuild /api/<nested>?query from the rewrite contract:
 *   /api/roles/backend-dev  →  /api?__path=roles/backend-dev
 *   /api/paths/learning?from=a&to=b  →  /api?__path=paths/learning&from=a&to=b
 */
function restoreOriginalUrl(req: IncomingMessage): void {
  const current = req.url || "/";
  try {
    const url = new URL(current, "http://localhost");
    const embedded = url.searchParams.get("__path");

    if (embedded) {
      url.searchParams.delete("__path");
      const qs = url.searchParams.toString();
      req.url = `/api/${embedded}${qs ? `?${qs}` : ""}`;
      return;
    }
  } catch {
    // fall through to header-based restoration
  }

  const headerCandidates = [
    req.headers["x-forwarded-uri"],
    req.headers["x-invoke-path"],
    req.headers["x-vercel-forwarded-uri"],
  ];

  for (const raw of headerCandidates) {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value || typeof value !== "string") continue;

    try {
      const pathWithQuery = value.startsWith("http")
        ? `${new URL(value).pathname}${new URL(value).search}`
        : value;
      const pathOnly = pathWithQuery.split("?")[0];
      if (pathOnly.startsWith("/api/") && pathOnly !== "/api") {
        req.url = pathWithQuery;
        return;
      }
    } catch {
      // ignore malformed headers
    }
  }

  // Already a full /api/... path (local verify script, or no rewrite)
  if (current.startsWith("/api/")) {
    return;
  }

  // Bare /api with no embedded path — leave as-is for top-level routes that
  // were rewritten from /api/<segment> without capturing (shouldn't happen).
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  restoreOriginalUrl(req);
  return app(req, res);
}
