import { Router, Request, Response, NextFunction } from "express";
import { verifyConnection, runQuery, runQuerySingle } from "../db/driver.js";
import { queries } from "../db/queries.js";

export const apiRouter = Router();

async function withDb<T>(
  res: Response,
  handler: () => Promise<T>
): Promise<void> {
  try {
    const data = await handler();
    res.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Database query failed";
    const isConnectionError =
      message.includes("connect") ||
      message.includes("ECONNREFUSED") ||
      message.includes("credentials") ||
      message.includes("ServiceUnavailable");

    res.status(isConnectionError ? 503 : 500).json({
      success: false,
      error: message,
      code: isConnectionError ? "DATABASE_UNAVAILABLE" : "QUERY_ERROR",
    });
  }
}

apiRouter.get("/health", async (_req: Request, res: Response) => {
  const status = await verifyConnection();
  if (!status.connected) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      database: status,
    });
    return;
  }

  try {
    const result = await runQuerySingle<{ nodeCount: number }>(queries.healthCheck);
    const nodeCount = result?.nodeCount ?? 0;
    res.json({
      success: true,
      status: "healthy",
      database: { connected: true, nodeCount },
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
