/**
 * Bundled by esbuild → api/bundle.cjs (CommonJS).
 * Vercel cannot reliably load server/dist ESM ("type": "module") into
 * serverless functions — bundling into CJS fixes the crash that returned
 * plain text "A server error has occurred".
 */
import serverless from "serverless-http";
import { createApp } from "../server/src/app";

const app = createApp({ mountAtRoot: true });

export default serverless(app);
