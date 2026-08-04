/**
 * Parameterised Cypher queries for SkillPath Graph.
 * All queries use $parameters — never string concatenation.
 */

export const queries = {
  /** Health check — returns node count */
  healthCheck: `
    MATCH (n)
    RETURN count(n) AS nodeCount
  `,

  /** Graph statistics for dashboard */
  graphStats: `
    MATCH (s:Skill) WITH count(s) AS skills
    MATCH (r:Role) WITH skills, count(r) AS roles
    MATCH (c:Course) WITH skills, roles, count(c) AS courses
    MATCH (p:Person) WITH skills, roles, courses, count(p) AS people
    MATCH ()-[rel]->() WITH skills, roles, courses, people, count(rel) AS relationships
    RETURN skills, roles, courses, people, relationships
  `,

  /** List all skills with optional category filter */
  listSkills: `
    MATCH (s:Skill)
    WHERE $category IS NULL OR s.category = $category
    OPTIONAL MATCH (s)<-[:TEACHES]-(c:Course)
    WITH s, count(c) AS courseCount
    RETURN s.id AS id, s.name AS name, s.category AS category,
           s.description AS description, s.difficulty AS difficulty,
           courseCount
    ORDER BY s.category, s.name
  `,

  /** List skill categories */
  listCategories: `
    MATCH (s:Skill)
    RETURN DISTINCT s.category AS category
    ORDER BY category
  `,

  /** Get skill by id with prerequisites and dependents */
  getSkillDetail: `
    MATCH (s:Skill {id: $skillId})
    OPTIONAL MATCH (prereq:Skill)-[:PREREQUISITE_FOR]->(s)
    OPTIONAL MATCH (s)-[:PREREQUISITE_FOR]->(next:Skill)
    OPTIONAL MATCH (c:Course)-[:TEACHES]->(s)
    OPTIONAL MATCH (r:Role)-[req:REQUIRES]->(s)
    RETURN s.id AS id, s.name AS name, s.category AS category,
           s.description AS description, s.difficulty AS difficulty,
           collect(DISTINCT {id: prereq.id, name: prereq.name}) AS prerequisites,
           collect(DISTINCT {id: next.id, name: next.name}) AS unlocks,
           collect(DISTINCT {id: c.id, name: c.name, provider: c.provider}) AS courses,
           collect(DISTINCT {id: r.id, name: r.name, importance: req.importance}) AS roles
  `,

  /** List all roles */
  listRoles: `
    MATCH (r:Role)
    OPTIONAL MATCH (r)-[:REQUIRES]->(s:Skill)
    WITH r, count(s) AS skillCount
    RETURN r.id AS id, r.name AS name, r.description AS description,
           r.level AS level, r.salaryMin AS salaryMin, r.salaryMax AS salaryMax,
           skillCount
    ORDER BY r.name
  `,

  /** Get role detail with required skills */
  getRoleDetail: `
    MATCH (r:Role {id: $roleId})
    OPTIONAL MATCH (r)-[req:REQUIRES]->(s:Skill)
    OPTIONAL MATCH (prereq:Skill)-[:PREREQUISITE_FOR*1..3]->(s)
    RETURN r.id AS id, r.name AS name, r.description AS description,
           r.level AS level, r.salaryMin AS salaryMin, r.salaryMax AS salaryMax,
           collect(DISTINCT {
             id: s.id, name: s.name, category: s.category,
             importance: req.importance, difficulty: s.difficulty
           }) AS requiredSkills
  `,

  /**
   * MULTI-HOP (2+ hops): Shortest learning path between two skills
   * Traverses PREREQUISITE_FOR relationships in both directions
   */
  findLearningPath: `
    MATCH (start:Skill {id: $fromSkillId}), (end:Skill {id: $toSkillId})
    MATCH path = shortestPath(
      (start)-[:PREREQUISITE_FOR|RELATED_TO*..8]-(end)
    )
    WITH path
    UNWIND range(0, length(path) - 1) AS idx
    WITH nodes(path)[idx] AS node, idx,
         CASE WHEN idx < length(path) - 1
           THEN type(relationships(path)[idx])
           ELSE null END AS relType
    RETURN node.id AS id, node.name AS name, node.category AS category,
           node.difficulty AS difficulty, idx AS step, relType
    ORDER BY idx
  `,

  /**
   * RELATIONALLY AWKWARD: Find roles matchable from a set of skills
   * Scores by how many required skills the user has (multi-hop via prerequisites)
   */
  matchRolesBySkills: `
    UNWIND $skillIds AS skillId
    MATCH (userSkill:Skill {id: skillId})
    WITH collect(userSkill) AS userSkills

    MATCH (r:Role)-[req:REQUIRES]->(needed:Skill)
    WITH r, userSkills,
         collect(DISTINCT {skill: needed, importance: req.importance}) AS requirements

    UNWIND requirements AS reqItem
    WITH r, requirements, reqItem, userSkills,
         reqItem.skill AS needed,
         reqItem.importance AS importance

    OPTIONAL MATCH (us:Skill)
    WHERE us IN userSkills
      AND (
        us = needed
        OR (us)-[:PREREQUISITE_FOR*1..4]->(needed)
        OR (needed)-[:PREREQUISITE_FOR*1..4]->(us)
      )
    WITH r, requirements, needed, importance,
         count(DISTINCT us) > 0 AS hasSkillOrPrereq

    WITH r, requirements,
         sum(CASE WHEN hasSkillOrPrereq AND importance = 'essential' THEN 2
                  WHEN hasSkillOrPrereq THEN 1 ELSE 0 END) AS matchScore,
         size([x IN requirements WHERE x.importance = 'essential']) AS essentialCount,
         size(requirements) AS totalRequired

    WHERE matchScore > 0
    RETURN r.id AS id, r.name AS name, r.level AS level,
           r.salaryMin AS salaryMin, r.salaryMax AS salaryMax,
           matchScore, essentialCount, totalRequired,
           round(toFloat(matchScore) / (essentialCount * 2 + (totalRequired - essentialCount)) * 100) AS matchPercent
    ORDER BY matchPercent DESC, matchScore DESC
    LIMIT $limit
  `,

  /**
   * MULTI-HOP: Find bridge skills connecting two roles
   * Skills that appear in paths between role requirements
   */
  findBridgeSkills: `
    MATCH (r1:Role {id: $roleId1})-[:REQUIRES]->(s1:Skill)
    MATCH (r2:Role {id: $roleId2})-[:REQUIRES]->(s2:Skill)
    MATCH path = shortestPath((s1)-[:PREREQUISITE_FOR|RELATED_TO*..5]-(s2))
    WITH path, length(path) AS pathLength
    UNWIND nodes(path) AS bridge
    WITH bridge, pathLength
    WHERE 'Skill' IN labels(bridge)
    WITH DISTINCT bridge, pathLength
    OPTIONAL MATCH (bridge)<-[:TEACHES]-(c:Course)
    RETURN bridge.id AS id, bridge.name AS name, bridge.category AS category,
           pathLength,
           collect(DISTINCT {id: c.id, name: c.name}) AS courses
    ORDER BY pathLength, bridge.name
    LIMIT 10
  `,

  /** Recommend courses for a target role based on skill gaps */
  recommendCourses: `
    MATCH (r:Role {id: $roleId})-[req:REQUIRES]->(needed:Skill)
    WHERE NOT needed.id IN $knownSkillIds
    OPTIONAL MATCH (c:Course)-[t:TEACHES]->(needed)
    WITH needed, req, c, t
    ORDER BY CASE req.importance WHEN 'essential' THEN 0 ELSE 1 END, needed.difficulty
    RETURN needed.id AS skillId, needed.name AS skillName,
           req.importance AS importance,
           collect(DISTINCT {
             id: c.id, name: c.name, provider: c.provider,
             durationHours: c.durationHours, proficiency: t.proficiency
           }) AS courses
    LIMIT $limit
  `,

  /** Search skills and roles by name */
  search: `
    MATCH (s:Skill)
    WHERE toLower(s.name) CONTAINS toLower($query)
    RETURN 'skill' AS type, s.id AS id, s.name AS name,
           s.category AS subtitle, s.description AS description
    LIMIT $limit
    UNION
    MATCH (r:Role)
    WHERE toLower(r.name) CONTAINS toLower($query)
    RETURN 'role' AS type, r.id AS id, r.name AS name,
           r.level AS subtitle, r.description AS description
    LIMIT $limit
  `,

  /** Get related skills (1-2 hops via RELATED_TO and PREREQUISITE_FOR) */
  getRelatedSkills: `
    MATCH (s:Skill {id: $skillId})
    MATCH (s)-[:RELATED_TO|PREREQUISITE_FOR*1..2]-(related:Skill)
    WHERE related <> s
    WITH DISTINCT related
    RETURN related.id AS id, related.name AS name,
           related.category AS category, related.difficulty AS difficulty
    ORDER BY related.name
    LIMIT $limit
  `,

  /** List courses */
  listCourses: `
    MATCH (c:Course)-[:TEACHES]->(s:Skill)
    WITH c, collect(DISTINCT {id: s.id, name: s.name}) AS skills
    RETURN c.id AS id, c.name AS name, c.provider AS provider,
           c.durationHours AS durationHours, c.url AS url, skills
    ORDER BY c.name
  `,
};
