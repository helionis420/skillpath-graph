/**
 * Single Vercel serverless entry for every /api/* route.
 * Nested paths are rewritten here by vercel.json so /api/roles/:id works.
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
