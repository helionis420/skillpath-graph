import { Router, Request, Response, NextFunction } from "express";
import { runQuery, runQuerySingle } from "../db/driver.js";
import { probeDatabase } from "../db/probe.js";
import { queries } from "../db/queries.js";
import { validateConfig } from "../config.js";

export const apiRouter = Router();

/** Connection/config failures map to 503 so the UI can show a database-specific state. */
function isUnavailableError(message: string): boolean {
  return [
    "connect",
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "credentials",
    "not configured",
    "timed out",
    "ServiceUnavailable",
    "SessionExpired",
    "Unauthorized",
    "authentication",
  ].some((needle) => message.toLowerCase().includes(needle.toLowerCase()));
}

async function withDb<T>(res: Response, handler: () => Promise<T>): Promise<void> {
  try {
    const data = await handler();
    res.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database query failed";
    const unavailable = isUnavailableError(message);

    res.status(unavailable ? 503 : 500).json({
      success: false,
      error: message,
      code: unavailable ? "DATABASE_UNAVAILABLE" : "QUERY_ERROR",
    });
  }
}

apiRouter.get("/health", async (_req: Request, res: Response) => {
  const configErrors = validateConfig();
  if (configErrors.length > 0) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: {
        connected: false,
        error: `Missing configuration: ${configErrors.join(", ")}`,
      },
    });
    return;
  }

  // Single round trip — verifyConnectivity() plus a query doubles cold-start latency
  try {
    const result = await runQuerySingle<{ nodeCount: number }>(queries.healthCheck);
    res.json({
      success: true,
      status: "healthy",
      database: { connected: true, nodeCount: result?.nodeCount ?? 0 },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: {
        connected: false,
        error: err instanceof Error ? err.message : "Health check failed",
      },
    });
  }
});

/**
 * Diagnostics — reports configuration and network reachability without exposing
 * secrets. Distinguishes "env vars missing" from "database unreachable".
 */
apiRouter.get("/diagnostics", async (_req: Request, res: Response) => {
  const uri = process.env.COGNODB_URI ?? "";
  const configErrors = validateConfig();

  let network: Awaited<ReturnType<typeof probeDatabase>> | { error: string } | null = null;
  if (uri) {
    try {
      network = await probeDatabase(uri);
    } catch (err) {
      network = { error: err instanceof Error ? err.message : "Probe failed" };
    }
  }

  res.json({
    success: true,
    data: {
      runtime: process.env.VERCEL ? "vercel" : "node",
      region: process.env.VERCEL_REGION ?? null,
      nodeVersion: process.version,
      env: {
        COGNODB_URI: uri ? `${uri.slice(0, 12)}…${uri.slice(-18)}` : null,
        COGNODB_USERNAME: process.env.COGNODB_USERNAME ?? null,
        COGNODB_PASSWORD: process.env.COGNODB_PASSWORD ? "set" : null,
      },
      configErrors,
      network,
    },
  });
});

apiRouter.get("/stats", (req, res) =>
  withDb(res, () => runQuerySingle(queries.graphStats))
);

apiRouter.get("/skills", (req, res) =>
  withDb(res, () =>
    runQuery(queries.listSkills, {
      category: req.query.category ? String(req.query.category) : null,
    })
  )
);

apiRouter.get("/skills/categories", (_req, res) =>
  withDb(res, () => runQuery(queries.listCategories))
);

apiRouter.get("/skills/:id", (req, res) =>
  withDb(res, () =>
    runQuerySingle(queries.getSkillDetail, { skillId: req.params.id })
  )
);

apiRouter.get("/skills/:id/related", (req, res) =>
  withDb(res, () =>
    runQuery(queries.getRelatedSkills, {
      skillId: req.params.id,
      limit: parseInt(String(req.query.limit ?? "10"), 10),
    })
  )
);

apiRouter.get("/roles", (_req, res) =>
  withDb(res, () => runQuery(queries.listRoles))
);

apiRouter.get("/roles/:id", (req, res) =>
  withDb(res, () =>
    runQuerySingle(queries.getRoleDetail, { roleId: req.params.id })
  )
);

apiRouter.get("/roles/:id/recommendations", (req, res) =>
  withDb(res, () => {
    const knownRaw = req.query.knownSkills;
    const knownSkillIds = knownRaw
      ? String(knownRaw).split(",").filter(Boolean)
      : [];
    return runQuery(queries.recommendCourses, {
      roleId: req.params.id,
      knownSkillIds,
      limit: parseInt(String(req.query.limit ?? "10"), 10),
    });
  })
);

apiRouter.get("/paths/learning", (req, res) => {
  const fromSkillId = String(req.query.from ?? "");
  const toSkillId = String(req.query.to ?? "");
  if (!fromSkillId || !toSkillId) {
    res.status(400).json({
      success: false,
      error: "Query parameters 'from' and 'to' (skill IDs) are required",
    });
    return;
  }
  withDb(res, () =>
    runQuery(queries.findLearningPath, { fromSkillId, toSkillId })
  );
});

apiRouter.post("/roles/match", (req, res) => {
  const skillIds = req.body?.skillIds;
  if (!Array.isArray(skillIds) || skillIds.length === 0) {
    res.status(400).json({
      success: false,
      error: "Request body must include skillIds array",
    });
    return;
  }
  withDb(res, () =>
    runQuery(queries.matchRolesBySkills, {
      skillIds,
      limit: parseInt(String(req.query.limit ?? "10"), 10),
    })
  );
});

apiRouter.get("/paths/bridge", (req, res) => {
  const roleId1 = String(req.query.role1 ?? "");
  const roleId2 = String(req.query.role2 ?? "");
  if (!roleId1 || !roleId2) {
    res.status(400).json({
      success: false,
      error: "Query parameters 'role1' and 'role2' are required",
    });
    return;
  }
  withDb(res, () =>
    runQuery(queries.findBridgeSkills, { roleId1, roleId2 })
  );
});

apiRouter.get("/search", (req, res) => {
  const query = String(req.query.q ?? "").trim();
  if (!query) {
    res.status(400).json({
      success: false,
      error: "Query parameter 'q' is required",
    });
    return;
  }
  withDb(res, () =>
    runQuery(queries.search, {
      query,
      limit: parseInt(String(req.query.limit ?? "20"), 10),
    })
  );
});

apiRouter.get("/courses", (_req, res) =>
  withDb(res, () => runQuery(queries.listCourses))
);

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, error: "Endpoint not found" });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
