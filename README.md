# SkillPath Graph

**A career & skills pathfinder backed by [CognoDB](https://cognodb.com) — a graph database that speaks openCypher over Bolt.**

Explore how tech skills connect, find learning paths between skills, match your skills to careers, and discover bridge skills between roles — all powered by graph traversals that would be awkward in SQL.

> **Live demo:** _Add your Render/Railway URL after deployment_  
> **Screen recording:** _Add Loom/YouTube link before submission_

---

## Why a graph database?

SkillPath models a **network**, not a spreadsheet:

| Question | Relational approach | Graph approach |
|----------|--------------------|----------------|
| "What's the shortest learning path from Python to LLM Engineering?" | Recursive CTEs, multiple self-joins on a prerequisite table, path reconstruction in application code | `shortestPath((a)-[:PREREQUISITE_FOR*..8]-(b))` — one Cypher pattern |
| "Which roles match my skills, counting prerequisites I've already mastered?" | JOIN skills → prerequisites (up to N levels) → role requirements, weighted scoring in SQL | Traverse `PREREQUISITE_FOR*1..4` in a single parameterized query |
| "What skills bridge Frontend Developer and Graph Data Engineer?" | Cross-product of role skill sets + path finding between each pair | Multi-hop traversal between role requirement nodes |

**Relationships are first-class.** A skill's prerequisites, the roles that require it, and the courses that teach it are typed edges — not foreign keys buried in join tables. Traversals are the query primitive, which matches how people actually think about career planning: "If I know X, what can I learn next?" and "How do I get from A to B?"

---

## Data model

```
┌─────────────┐     PREREQUISITE_FOR      ┌─────────────┐
│    Skill    │ ─────────────────────────►│    Skill    │
│             │◄─────────────────────────│             │
└──────┬──────┘     RELATED_TO (both)     └──────┬──────┘
       │                                          │
       │ TEACHES                          REQUIRES │
       ▼                                          ▼
┌─────────────┐                          ┌─────────────┐
│   Course    │                          │    Role     │
└─────────────┘                          └──────┬──────┘
                                                │
┌─────────────┐     HAS_SKILL            HELD_ROLE │
│   Person    │ ───────────────────► Skill    ◄──────┘
└─────────────┘
```

### Node labels & properties

| Label | Properties | Count (seed) |
|-------|-----------|--------------|
| `Skill` | `id`, `name`, `category`, `description`, `difficulty` | 30 |
| `Role` | `id`, `name`, `description`, `level`, `salaryMin`, `salaryMax` | 10 |
| `Course` | `id`, `name`, `provider`, `durationHours`, `url` | 15 |
| `Person` | `id`, `name`, `bio` | 5 |

### Relationship types

| Type | From → To | Properties |
|------|-----------|------------|
| `PREREQUISITE_FOR` | Skill → Skill | — |
| `RELATED_TO` | Skill ↔ Skill | bidirectional |
| `REQUIRES` | Role → Skill | `importance`: essential \| recommended |
| `TEACHES` | Course → Skill | `proficiency`: beginner \| intermediate \| advanced |
| `HAS_SKILL` | Person → Skill | `level`: 1–5 |
| `HELD_ROLE` | Person → Role | `years` |

---

## Main Cypher queries

All queries live in [`server/src/db/queries.ts`](server/src/db/queries.ts) and use **parameterized** `$variables` via the official Neo4j JavaScript driver — no string concatenation.

### 1. Shortest learning path (multi-hop, 2+ hops)

Finds the shortest path between two skills through prerequisite and related-skill edges:

```cypher
MATCH (start:Skill {id: $fromSkillId}), (end:Skill {id: $toSkillId})
MATCH path = shortestPath(
  (start)-[:PREREQUISITE_FOR|RELATED_TO*..8]-(end)
)
RETURN nodes(path), relationships(path)
```

**Example:** Python → Statistics → Machine Learning → Deep Learning → NLP → LLM Engineering (5 hops)

**UI:** Path Finder page (`/pathfinder`)

### 2. Role matcher with prerequisite-aware scoring (relationally awkward)

Scores roles by matching user skills **and** skills connected via up to 4 prerequisite hops:

```cypher
UNWIND $skillIds AS skillId
MATCH (userSkill:Skill {id: skillId})
WITH collect(userSkill) AS userSkills

MATCH (r:Role)-[req:REQUIRES]->(needed:Skill)
-- For each required skill, check if user has it OR a prerequisite within 4 hops
OPTIONAL MATCH (us:Skill)
WHERE us IN userSkills
  AND (us = needed OR (us)-[:PREREQUISITE_FOR*1..4]->(needed))
-- Weight essential skills 2×, compute match percentage
```

**UI:** Role Matcher page (`/matcher`)

### 3. Bridge skills between two roles (multi-hop)

Finds skills on shortest paths between the skill requirements of two different careers:

```cypher
MATCH (r1:Role {id: $roleId1})-[:REQUIRES]->(s1:Skill)
MATCH (r2:Role {id: $roleId2})-[:REQUIRES]->(s2:Skill)
MATCH path = shortestPath((s1)-[:PREREQUISITE_FOR|RELATED_TO*..5]-(s2))
RETURN DISTINCT nodes(path) AS bridgeSkills
```

**UI:** Path Finder → Bridge Skills section

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Database | [CognoDB Cloud](https://console.cognodb.com) (Bolt 5.x, openCypher) |
| Driver | [neo4j-driver](https://www.npmjs.com/package/neo4j-driver) v5 (official Neo4j JS driver) |
| Backend | Node.js, Express, TypeScript |
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Hosting | Render (see `render.yaml`) |

---

## Prerequisites

- **Node.js** 18+
- **CognoDB Cloud** free instance ([sign up](https://console.cognodb.com/signup))

---

## Setup

### 1. Create a CognoDB instance

1. Go to [console.cognodb.com/signup](https://console.cognodb.com/signup) and create an account (no credit card).
2. Create a **free (c0)** instance and pick a region.
3. Copy the connection URI (`bolt+s://<instance-id>.databases.cognodb.cloud`) and password.
   - Username is always `cognodb`.
   - **The password is shown once** — save it immediately.

### 2. Clone and configure

```bash
git clone <your-repo-url>
cd skillpath-graph
cp .env.example .env
```

Edit `.env`:

```env
COGNODB_URI=bolt+s://your-instance-id.databases.cognodb.cloud
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=your-generated-password
PORT=3001
```

### 3. Install dependencies

```bash
npm install
```

### 4. Seed the database

```bash
npm run seed
```

Expected output:

```
Connected to CognoDB.
Creating 30 skills...
Creating 10 roles...
...
Relationship counts:
  PREREQUISITE_FOR: 24
  REQUIRES: 52
  ...
```

### 5. Run locally

```bash
npm run dev
```

- **Frontend:** http://localhost:5173 (proxies API to backend)
- **Backend API:** http://localhost:3001/api/health

### 6. Production build

```bash
npm run build
npm start
```

Serves the built React app and API from port 3001.

---

## Project structure

```
skillpath-graph/
├── client/                 # React frontend (Vite + Tailwind)
│   └── src/
│       ├── api/            # API client
│       ├── components/     # Layout, UI states
│       └── pages/          # Dashboard, Skills, Path Finder, etc.
├── server/
│   └── src/
│       ├── db/
│       │   ├── driver.ts   # Neo4j driver + connection handling
│       │   └── queries.ts  # All parameterized Cypher queries
│       ├── routes/         # Express API routes
│       └── seed/           # Seed data + loader script
├── docs/screenshots/       # UI screenshots for README
├── .env.example
├── render.yaml             # Render deployment config
└── README.md
```

---

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | DB connectivity check |
| GET | `/api/stats` | Graph node/relationship counts |
| GET | `/api/skills` | List skills (optional `?category=`) |
| GET | `/api/skills/:id` | Skill detail with prerequisites |
| GET | `/api/roles` | List career roles |
| GET | `/api/paths/learning?from=&to=` | Shortest learning path |
| POST | `/api/roles/match` | Match skills to roles (`{ skillIds: [] }`) |
| GET | `/api/paths/bridge?role1=&role2=` | Bridge skills between roles |
| GET | `/api/search?q=` | Search skills and roles |

---

## Error handling

When CognoDB is unreachable, the API returns **503** with `{ code: "DATABASE_UNAVAILABLE" }`. The UI shows a dedicated error state with retry button and setup hints — no silent failures or blank screens.

---

## Deployment (Render)

1. Push repo to GitHub.
2. Create a new **Web Service** on [Render](https://render.com) and connect the repo.
3. Use `render.yaml` or set:
   - **Build:** `npm install && npm run build`
   - **Start:** `npm run start`
4. Add environment variables: `COGNODB_URI`, `COGNODB_PASSWORD`, `COGNODB_USERNAME=cognodb`, `NODE_ENV=production`.
5. Run `npm run seed` locally against your CognoDB instance (seed is not run on deploy).
6. Add the live URL to this README.

---

## Screenshots

_Add screenshots to `docs/screenshots/` and embed here before submission:_

| Dashboard | Skills | Path Finder |
|-----------|--------|-------------|
| ![Dashboard](./docs/screenshots/dashboard.png) | ![Skills](./docs/screenshots/skills.png) | ![Path Finder](./docs/screenshots/pathfinder.png) |

---

## License

MIT — built as a Wexa AI take-home assignment demonstrating graph data modeling with CognoDB.
