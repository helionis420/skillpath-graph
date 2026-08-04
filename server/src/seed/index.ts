import { getDriver, closeDriver } from "../db/driver.js";
import { validateConfig } from "../config.js";
import {
  skills,
  roles,
  courses,
  people,
  prerequisitesFixed,
  relatedSkills,
  roleRequirements,
  courseTeaches,
  personSkills,
  personRoles,
} from "./data.js";

async function clearDatabase(session: ReturnType<ReturnType<typeof getDriver>["session"]>): Promise<void> {
  console.log("Clearing existing data...");
  await session.run("MATCH (n) DETACH DELETE n");
}

async function createConstraints(session: ReturnType<ReturnType<typeof getDriver>["session"]>): Promise<void> {
  console.log("Creating constraints and indexes...");
  const statements = [
    "CREATE CONSTRAINT skill_id IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE",
    "CREATE CONSTRAINT role_id IF NOT EXISTS FOR (r:Role) REQUIRE r.id IS UNIQUE",
    "CREATE CONSTRAINT course_id IF NOT EXISTS FOR (c:Course) REQUIRE c.id IS UNIQUE",
    "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
  ];

  for (const cypher of statements) {
    try {
      await session.run(cypher);
    } catch {
      // IF NOT EXISTS may not be supported on all versions; try without
      const fallback = cypher.replace(" IF NOT EXISTS", "");
      try {
        await session.run(fallback);
      } catch {
        // Constraint may already exist
      }
    }
  }
}

async function seedNodes(session: ReturnType<ReturnType<typeof getDriver>["session"]>): Promise<void> {
  console.log(`Creating ${skills.length} skills...`);
  await session.run(
    `
    UNWIND $skills AS row
    CREATE (s:Skill {
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      difficulty: row.difficulty
    })
    `,
    { skills }
  );

  console.log(`Creating ${roles.length} roles...`);
  await session.run(
    `
    UNWIND $roles AS row
    CREATE (r:Role {
      id: row.id,
      name: row.name,
      description: row.description,
      level: row.level,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax
    })
    `,
    { roles }
  );

  console.log(`Creating ${courses.length} courses...`);
  await session.run(
    `
    UNWIND $courses AS row
    CREATE (c:Course {
      id: row.id,
      name: row.name,
      provider: row.provider,
      durationHours: row.durationHours,
      url: row.url
    })
    `,
    { courses }
  );

  console.log(`Creating ${people.length} people...`);
  await session.run(
    `
    UNWIND $people AS row
    CREATE (p:Person {
      id: row.id,
      name: row.name,
      bio: row.bio
    })
    `,
    { people }
  );
}

async function seedRelationships(session: ReturnType<ReturnType<typeof getDriver>["session"]>): Promise<void> {
  console.log("Creating PREREQUISITE_FOR relationships...");
  await session.run(
    `
    UNWIND $pairs AS pair
    MATCH (from:Skill {id: pair[0]}), (to:Skill {id: pair[1]})
    CREATE (from)-[:PREREQUISITE_FOR]->(to)
    `,
    { pairs: prerequisitesFixed }
  );

  console.log("Creating RELATED_TO relationships...");
  await session.run(
    `
    UNWIND $pairs AS pair
    MATCH (a:Skill {id: pair[0]}), (b:Skill {id: pair[1]})
    CREATE (a)-[:RELATED_TO]->(b), (b)-[:RELATED_TO]->(a)
    `,
    { pairs: relatedSkills }
  );

  console.log("Creating REQUIRES relationships...");
  await session.run(
    `
    UNWIND $reqs AS req
    MATCH (r:Role {id: req[0]}), (s:Skill {id: req[1]})
    CREATE (r)-[:REQUIRES {importance: req[2]}]->(s)
    `,
    { reqs: roleRequirements }
  );

  console.log("Creating TEACHES relationships...");
  await session.run(
    `
    UNWIND $teaches AS t
    MATCH (c:Course {id: t[0]}), (s:Skill {id: t[1]})
    CREATE (c)-[:TEACHES {proficiency: t[2]}]->(s)
    `,
    { teaches: courseTeaches }
  );

  console.log("Creating HAS_SKILL relationships...");
  await session.run(
    `
    UNWIND $ps AS row
    MATCH (p:Person {id: row[0]}), (s:Skill {id: row[1]})
    CREATE (p)-[:HAS_SKILL {level: row[2]}]->(s)
    `,
    { ps: personSkills }
  );

  console.log("Creating HELD_ROLE relationships...");
  await session.run(
    `
    UNWIND $pr AS row
    MATCH (p:Person {id: row[0]}), (r:Role {id: row[1]})
    CREATE (p)-[:HELD_ROLE {years: row[2]}]->(r)
    `,
    { pr: personRoles }
  );
}

async function printSummary(session: ReturnType<ReturnType<typeof getDriver>["session"]>): Promise<void> {
  const result = await session.run(`
    MATCH (n)
    RETURN labels(n)[0] AS label, count(n) AS count
    ORDER BY label
  `);
  console.log("\nSeed complete — node counts:");
  for (const record of result.records) {
    console.log(`  ${record.get("label")}: ${record.get("count").toNumber()}`);
  }

  const relResult = await session.run(`
    MATCH ()-[r]->()
    RETURN type(r) AS type, count(r) AS count
    ORDER BY type
  `);
  console.log("\nRelationship counts:");
  for (const record of relResult.records) {
    console.log(`  ${record.get("type")}: ${record.get("count").toNumber()}`);
  }
}

async function main(): Promise<void> {
  const errors = validateConfig();
  if (errors.length > 0) {
    console.error("Missing configuration:");
    errors.forEach((e) => console.error(`  - ${e}`));
    console.error("\nCopy .env.example to .env and fill in your CognoDB credentials.");
    process.exit(1);
  }

  const driver = getDriver();
  const session = driver.session();

  try {
    await driver.verifyConnectivity();
    console.log("Connected to CognoDB.\n");

    await clearDatabase(session);
    await createConstraints(session);
    await seedNodes(session);
    await seedRelationships(session);
    await printSummary(session);
  } catch (err) {
    console.error("Seed failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await session.close();
    await closeDriver();
  }
}

main();
