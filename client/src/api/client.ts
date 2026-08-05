export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  difficulty: string;
  courseCount?: number;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  level: string;
  salaryMin: number;
  salaryMax: number;
  skillCount?: number;
}

export interface SkillDetail extends Skill {
  prerequisites: Array<{ id: string; name: string }>;
  unlocks: Array<{ id: string; name: string }>;
  courses: Array<{ id: string; name: string; provider: string }>;
  roles: Array<{ id: string; name: string; importance: string }>;
}

export interface RoleDetail extends Role {
  requiredSkills: Array<{
    id: string;
    name: string;
    category: string;
    importance: string;
    difficulty: string;
  }>;
}

export interface GraphStats {
  skills: { low: number } | number;
  roles: { low: number } | number;
  courses: { low: number } | number;
  people: { low: number } | number;
  relationships: { low: number } | number;
}

export interface PathStep {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  step: number;
  relType: string | null;
}

export interface RoleMatch {
  id: string;
  name: string;
  level: string;
  salaryMin: number;
  salaryMax: number;
  matchScore: number;
  essentialCount: number;
  totalRequired: number;
  matchPercent: number;
}

export interface BridgeSkill {
  id: string;
  name: string;
  category: string;
  pathLength: number;
  courses: Array<{ id: string; name: string }>;
}

export interface CourseRecommendation {
  skillId: string;
  skillName: string;
  importance: string;
  courses: Array<{
    id: string;
    name: string;
    provider: string;
    durationHours: number;
    proficiency: string;
  }>;
}

export interface SearchResult {
  type: "skill" | "role";
  id: string;
  name: string;
  subtitle: string;
  description: string;
}

export interface Course {
  id: string;
  name: string;
  provider: string;
  durationHours: number;
  url: string;
  skills: Array<{ id: string; name: string }>;
}

export interface HealthStatus {
  success: boolean;
  status: string;
  database?: {
    connected: boolean;
    nodeCount?: number;
    error?: string;
  };
}

function toNumber(value: { low: number } | number | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === "number") return value;
  return value.low;
}

export { toNumber };

const API_BASE = import.meta.env.VITE_API_URL ?? "";

/** The API always returns JSON; anything else means the platform intercepted the request. */
function describeNonJsonError(status: number, body: string): string {
  if (status === 504 || body.includes("FUNCTION_INVOCATION_TIMEOUT")) {
    return "The database did not respond in time. The CognoDB instance may be asleep or unreachable — wait a moment and retry.";
  }
  if (status === 404) {
    return "API route not found. The server may still be deploying.";
  }
  const preview = body.replace(/\s+/g, " ").slice(0, 140);
  return `API error (HTTP ${status}): ${preview || "empty response"}`;
}

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const text = await res.text();
  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text) as ApiResponse<T>;
  } catch {
    const err = new Error(describeNonJsonError(res.status, text)) as Error & { code?: string };
    err.code = res.status >= 500 ? "DATABASE_UNAVAILABLE" : "QUERY_ERROR";
    throw err;
  }

  if (!json.success) {
    const err = new Error(json.error ?? "Request failed") as Error & { code?: string };
    err.code = json.code;
    throw err;
  }

  return json.data as T;
}

export const api = {
  health: async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    const text = await res.text();
    try {
      return JSON.parse(text) as HealthStatus;
    } catch {
      return {
        success: false,
        status: "unhealthy",
        database: {
          connected: false,
          error: text.slice(0, 200) || `HTTP ${res.status}`,
        },
      };
    }
  },

  stats: () => fetchApi<GraphStats>("/api/stats"),

  skills: (category?: string) =>
    fetchApi<Skill[]>(`/api/skills${category ? `?category=${encodeURIComponent(category)}` : ""}`),

  categories: () => fetchApi<Array<{ category: string }>>("/api/skills/categories"),

  skill: (id: string) => fetchApi<SkillDetail>(`/api/skills/${id}`),

  relatedSkills: (id: string) => fetchApi<Skill[]>(`/api/skills/${id}/related`),

  roles: () => fetchApi<Role[]>("/api/roles"),

  role: (id: string) => fetchApi<RoleDetail>(`/api/roles/${id}`),

  learningPath: (from: string, to: string) =>
    fetchApi<PathStep[]>(`/api/paths/learning?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),

  matchRoles: (skillIds: string[]) =>
    fetchApi<RoleMatch[]>("/api/roles/match", {
      method: "POST",
      body: JSON.stringify({ skillIds }),
    }),

  bridgeSkills: (role1: string, role2: string) =>
    fetchApi<BridgeSkill[]>(
      `/api/paths/bridge?role1=${encodeURIComponent(role1)}&role2=${encodeURIComponent(role2)}`
    ),

  recommendCourses: (roleId: string, knownSkills: string[]) =>
    fetchApi<CourseRecommendation[]>(
      `/api/roles/${roleId}/recommendations?knownSkills=${knownSkills.join(",")}`
    ),

  search: (q: string) => fetchApi<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`),

  courses: () => fetchApi<Course[]>("/api/courses"),
};
