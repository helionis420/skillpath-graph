import neo4j, { Driver, Session } from "neo4j-driver";
import { config } from "../config.js";

/**
 * Serverless-safe CognoDB driver.
 *
 * Timeouts are deliberately shorter than the Vercel function limit so an
 * unreachable database returns a JSON 503 instead of FUNCTION_INVOCATION_TIMEOUT.
 */
const CONNECTION_TIMEOUT_MS = 8_000;
const QUERY_TIMEOUT_MS = 15_000;

/** Cache across warm invocations — module state can reset between cold starts. */
const globalCache = globalThis as typeof globalThis & { __cognodbDriver?: Driver };

export function getDriver(): Driver {
  if (globalCache.__cognodbDriver) {
    return globalCache.__cognodbDriver;
  }

  const { uri, username, password } = config.cognodb;
  if (!uri || !password) {
    throw new Error(
      "Database credentials are not configured. Set COGNODB_URI and COGNODB_PASSWORD."
    );
  }

  globalCache.__cognodbDriver = neo4j.driver(
    uri,
    neo4j.auth.basic(username, password),
    {
      // One warm connection per serverless instance is plenty
      maxConnectionPoolSize: 5,
      connectionTimeout: CONNECTION_TIMEOUT_MS,
      connectionAcquisitionTimeout: CONNECTION_TIMEOUT_MS,
      maxTransactionRetryTime: 5_000,
      maxConnectionLifetime: 60_000,
      disableLosslessIntegers: true,
    }
  );

  return globalCache.__cognodbDriver;
}

/** Reject instead of hanging past the platform's function timeout. */
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `${label} timed out after ${ms}ms — CognoDB did not respond. Verify the instance is running and reachable.`
          )
        ),
      ms
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function verifyConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    await withTimeout(
      getDriver().verifyConnectivity(),
      CONNECTION_TIMEOUT_MS,
      "Connectivity check"
    );
    return { connected: true };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : "Unknown connection error",
    };
  }
}

export function getSession(): Session {
  return getDriver().session();
}

export async function closeDriver(): Promise<void> {
  if (globalCache.__cognodbDriver) {
    await globalCache.__cognodbDriver.close();
    globalCache.__cognodbDriver = undefined;
  }
}

/** Neo4j integers arrive as { low, high } unless disableLosslessIntegers is set. */
function normalizeValue(value: unknown): unknown {
  if (
    value !== null &&
    typeof value === "object" &&
    "low" in value &&
    "high" in value &&
    typeof (value as { low: number }).low === "number"
  ) {
    return (value as { low: number }).low;
  }
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, normalizeValue(v)])
    );
  }
  return value;
}

export async function runQuery<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T[]> {
  const session = getSession();
  try {
    const result = await withTimeout(session.run(cypher, params), QUERY_TIMEOUT_MS, "Query");
    return result.records.map((record) => normalizeValue(record.toObject()) as T);
  } finally {
    // Never let a stuck session close block the response
    void session.close().catch(() => undefined);
  }
}

export async function runQuerySingle<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T | null> {
  const rows = await runQuery<T>(cypher, params);
  return rows[0] ?? null;
}
