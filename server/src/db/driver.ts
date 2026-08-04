import neo4j, { Driver, Session } from "neo4j-driver";
import { config } from "../config.js";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    if (!config.cognodb.uri || !config.cognodb.password) {
      throw new Error("Database credentials are not configured");
    }
    driver = neo4j.driver(
      config.cognodb.uri,
      neo4j.auth.basic(config.cognodb.username, config.cognodb.password),
      {
        maxConnectionPoolSize: 10,
        connectionAcquisitionTimeout: 30_000,
      }
    );
  }
  return driver;
}

export async function verifyConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    const d = getDriver();
    await d.verifyConnectivity();
    return { connected: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown connection error";
    return { connected: false, error: message };
  }
}

export function getSession(): Session {
  return getDriver().session();
}

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

/** Neo4j driver returns integers as { low, high } — normalize for JSON APIs */
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
    const result = await session.run(cypher, params);
    return result.records.map((record) => normalizeValue(record.toObject()) as T);
  } finally {
    await session.close();
  }
}

export async function runQuerySingle<T>(
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<T | null> {
  const rows = await runQuery<T>(cypher, params);
  return rows[0] ?? null;
}
