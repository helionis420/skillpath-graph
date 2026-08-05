/**
 * Bundled by esbuild → api/bundle.cjs (CommonJS).
 * Vercel cannot reliably load server/dist ESM ("type": "module") into
 * serverless functions — bundling into CJS fixes the crash that returned
 * plain text "A server error has occurred".
 */
import dns from "dns";
import serverless from "serverless-http";
import { createApp } from "../server/src/app";

// Serverless runtimes may order AAAA records first; an unroutable IPv6 address
// makes Bolt connections hang until the function is killed.
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older runtimes without this API
}

const app = createApp({ mountAtRoot: true });

export default serverless(app);
