import neo4j, { Driver, Session } from "neo4j-driver";
import dns from "dns";
import { config } from "../config.js";

/**
 * Serverless-safe CognoDB driver.
 *
 * Budget: every timeout must expire before the platform kills the function,
 * otherwise the caller gets an opaque FUNCTION_INVOCATION_TIMEOUT (504)
 * instead of an actionable JSON error.
 *
 *   TCP/TLS connect  4s
 *   Query            7s
 *   Vercel function 10s+ (see vercel.json)
 */
const CONNECTION_TIMEOUT_MS = 4_000;
const QUERY_TIMEOUT_MS = 7_000;

/**
 * Node 18+ returns DNS results in resolver order, which can put an unroutable
 * IPv6 address first inside serverless runtimes — the socket then hangs until
 * the platform timeout. Prefer IPv4.
 */
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Older runtimes without this API
}

/** Cached across warm invocations so repeat requests skip the TLS handshake. */
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

  globalCache.__cognodbDriver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    maxConnectionPoolSize: 5,
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    connectionAcquisitionTimeout: CONNECTION_TIMEOUT_MS,
    maxTransactionRetryTime: 3_000,
    maxConnectionLifetime: 60_000,
    disableLosslessIntegers: true,
  });

  return globalCache.__cognodbDriver;
}

/** Rejects instead of hanging past the platform's function timeout. */
async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `${label} timed out after ${ms}ms — CognoDB did not respond. Check that the instance is running and reachable from this network.`
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

export async function verifyConnection(): Promise<{ connected: boolean; error?: string }> {
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
    // A stuck close must never hold the response open
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
