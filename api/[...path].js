/**
 * Vercel serverless function handling every /api/* route.
 *
 * Delegates to the esbuild CommonJS bundle produced by `npm run bundle:api`.
 * The export is an Express app, which Vercel calls as (req, res).
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
          "API bundle missing. Ensure the build runs `npm run bundle:api` before deploy.",
        detail: err instanceof Error ? err.message : String(err),
      })
    );
  };
}
