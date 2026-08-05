/**
 * Bundled by esbuild → api/bundle.cjs (CommonJS).
 *
 * Two constraints drive this file:
 *  1. server/ is ESM ("type": "module"); Vercel's function loader is CommonJS,
 *     so the app is bundled rather than imported from server/dist.
 *  2. Vercel invokes handlers as (req, res) — Node's http signature. An Express
 *     app *is* that function, so it is exported directly. Lambda adapters such
 *     as serverless-http expect (event, context) and silently never respond,
 *     which surfaces as FUNCTION_INVOCATION_TIMEOUT.
 */
import dns from "dns";
import { createApp } from "../server/src/app";

// Serverless runtimes may order AAAA records first; an unroutable IPv6 address
// makes Bolt connections hang until the function is killed.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older runtimes without this API
}

const app = createApp({ mountAtRoot: true });

export default app;
