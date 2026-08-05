/**
 * Vercel serverless function for all /api/* routes.
 *
 * Loads the esbuild CJS bundle from `npm run bundle:api`.
 * Importing server/dist ESM here crashes under Vercel ("A server error has occurred").
 */
try {
  const bundle = require("./bundle.cjs");
  module.exports = bundle.default || bundle;
} catch (err) {
  module.exports = (_req, res) => {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        code: "BUNDLE_MISSING",
        error:
          "API bundle missing. Ensure buildCommand runs `npm run bundle:api` before deploy.",
        detail: err instanceof Error ? err.message : String(err),
      })
    );
  };
}
