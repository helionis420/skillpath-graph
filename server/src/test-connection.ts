#!/usr/bin/env node
/**
 * Quick connectivity test for CognoDB.
 * Usage: npm run test:db -w server
 */
import { verifyConnection, runQuery, closeDriver } from "./db/driver.js";
import { validateConfig } from "./config.js";

async function main() {
  const errors = validateConfig();
  if (errors.length > 0) {
    console.error("Configuration errors:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log("Testing CognoDB connection...");
  const status = await verifyConnection();

  if (!status.connected) {
    console.error("FAILED:", status.error);
    process.exit(1);
  }

  console.log("Connected successfully.");

  const rows = await runQuery<{ label: string; count: number }>(`
    MATCH (n)
    RETURN labels(n)[0] AS label, count(n) AS count
    ORDER BY label
  `);

  if (rows.length === 0) {
    console.log("\nDatabase is empty. Run: npm run seed");
  } else {
    console.log("\nNode counts:");
    for (const row of rows) {
      console.log(`  ${row.label}: ${row.count}`);
    }
  }

  await closeDriver();
  console.log("\nAll checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
