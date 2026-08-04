/**
 * Seed data for SkillPath Graph — realistic career & skills network.
 * Run: npm run seed (from project root)
 */

export interface SkillSeed {
  id: string;
  name: string;
  category: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface RoleSeed {
  id: string;
  name: string;
  description: string;
  level: string;
  salaryMin: number;
  salaryMax: number;
}

export interface CourseSeed {
  id: string;
  name: string;
  provider: string;
  durationHours: number;
  url: string;
}

export interface PersonSeed {
  id: string;
  name: string;
  bio: string;
}

export const skills: SkillSeed[] = [
  { id: "python", name: "Python", category: "Programming", description: "Versatile programming language for web, data, and automation.", difficulty: "beginner" },
  { id: "javascript", name: "JavaScript", category: "Programming", description: "Language of the web for frontend and backend development.", difficulty: "beginner" },
  { id: "typescript", name: "TypeScript", category: "Programming", description: "Typed superset of JavaScript for large-scale applications.", difficulty: "intermediate" },
  { id: "html-css", name: "HTML & CSS", category: "Web", description: "Foundational web markup and styling.", difficulty: "beginner" },
  { id: "react", name: "React", category: "Web", description: "Component-based UI library for building interactive frontends.", difficulty: "intermediate" },
  { id: "nodejs", name: "Node.js", category: "Backend", description: "JavaScript runtime for server-side applications.", difficulty: "intermediate" },
  { id: "sql", name: "SQL", category: "Data", description: "Structured query language for relational databases.", difficulty: "beginner" },
  { id: "postgresql", name: "PostgreSQL", category: "Data", description: "Advanced open-source relational database.", difficulty: "intermediate" },
  { id: "mongodb", name: "MongoDB", category: "Data", description: "Document-oriented NoSQL database.", difficulty: "intermediate" },
  { id: "graph-db", name: "Graph Databases", category: "Data", description: "Databases optimized for connected data and traversals.", difficulty: "advanced" },
  { id: "cypher", name: "Cypher Query Language", category: "Data", description: "Declarative graph query language used by Neo4j and CognoDB.", difficulty: "intermediate" },
  { id: "data-structures", name: "Data Structures", category: "Computer Science", description: "Arrays, trees, graphs, hash maps and algorithmic foundations.", difficulty: "intermediate" },
  { id: "algorithms", name: "Algorithms", category: "Computer Science", description: "Problem-solving techniques including sorting, searching, and optimization.", difficulty: "intermediate" },
  { id: "statistics", name: "Statistics", category: "Data Science", description: "Descriptive and inferential statistics for data analysis.", difficulty: "intermediate" },
  { id: "machine-learning", name: "Machine Learning", category: "Data Science", description: "Building models that learn patterns from data.", difficulty: "advanced" },
  { id: "deep-learning", name: "Deep Learning", category: "Data Science", description: "Neural networks for complex pattern recognition.", difficulty: "advanced" },
  { id: "nlp", name: "Natural Language Processing", category: "AI", description: "Processing and understanding human language with AI.", difficulty: "advanced" },
  { id: "llm-engineering", name: "LLM Engineering", category: "AI", description: "Building applications with large language models.", difficulty: "advanced" },
  { id: "prompt-engineering", name: "Prompt Engineering", category: "AI", description: "Designing effective prompts for AI systems.", difficulty: "intermediate" },
  { id: "docker", name: "Docker", category: "DevOps", description: "Containerization platform for packaging applications.", difficulty: "intermediate" },
  { id: "kubernetes", name: "Kubernetes", category: "DevOps", description: "Container orchestration for scalable deployments.", difficulty: "advanced" },
  { id: "aws", name: "AWS Cloud", category: "Cloud", description: "Amazon Web Services cloud platform fundamentals.", difficulty: "intermediate" },
  { id: "system-design", name: "System Design", category: "Architecture", description: "Designing scalable, reliable distributed systems.", difficulty: "advanced" },
  { id: "api-design", name: "REST API Design", category: "Backend", description: "Designing clean, versioned HTTP APIs.", difficulty: "intermediate" },
  { id: "git", name: "Git & Version Control", category: "Tools", description: "Distributed version control for collaborative development.", difficulty: "beginner" },
  { id: "testing", name: "Software Testing", category: "Engineering", description: "Unit, integration, and end-to-end testing practices.", difficulty: "intermediate" },
  { id: "agile", name: "Agile Methodologies", category: "Engineering", description: "Scrum, Kanban, and iterative delivery practices.", difficulty: "beginner" },
  { id: "cybersecurity", name: "Cybersecurity Basics", category: "Security", description: "OWASP, authentication, and secure coding fundamentals.", difficulty: "intermediate" },
  { id: "networking", name: "Computer Networking", category: "Infrastructure", description: "TCP/IP, DNS, HTTP, and network protocols.", difficulty: "intermediate" },
  { id: "linux", name: "Linux Administration", category: "Infrastructure", description: "Command line, shell scripting, and server management.", difficulty: "intermediate" },
];

export const roles: RoleSeed[] = [
  { id: "frontend-dev", name: "Frontend Developer", description: "Builds user interfaces and client-side web applications.", level: "Mid", salaryMin: 70000, salaryMax: 130000 },
  { id: "backend-dev", name: "Backend Developer", description: "Designs APIs, services, and server-side logic.", level: "Mid", salaryMin: 80000, salaryMax: 145000 },
  { id: "fullstack-dev", name: "Full Stack Developer", description: "Works across frontend, backend, and deployment.", level: "Mid", salaryMin: 85000, salaryMax: 155000 },
  { id: "data-engineer", name: "Data Engineer", description: "Builds data pipelines and infrastructure for analytics.", level: "Mid", salaryMin: 90000, salaryMax: 160000 },
  { id: "data-scientist", name: "Data Scientist", description: "Analyzes data and builds predictive models.", level: "Mid", salaryMin: 95000, salaryMax: 170000 },
  { id: "ml-engineer", name: "ML Engineer", description: "Productionizes machine learning models at scale.", level: "Senior", salaryMin: 120000, salaryMax: 200000 },
  { id: "ai-engineer", name: "AI Engineer", description: "Builds AI-powered products using LLMs and agents.", level: "Senior", salaryMin: 130000, salaryMax: 220000 },
  { id: "devops-engineer", name: "DevOps Engineer", description: "Automates deployment, monitoring, and infrastructure.", level: "Mid", salaryMin: 95000, salaryMax: 165000 },
  { id: "graph-engineer", name: "Graph Data Engineer", description: "Models and queries connected data with graph databases.", level: "Senior", salaryMin: 110000, salaryMax: 185000 },
  { id: "solutions-architect", name: "Solutions Architect", description: "Designs end-to-end technical solutions for complex systems.", level: "Senior", salaryMin: 130000, salaryMax: 210000 },
];

export const courses: CourseSeed[] = [
  { id: "c-py-101", name: "Python for Everybody", provider: "Coursera", durationHours: 40, url: "https://www.coursera.org/specializations/python" },
  { id: "c-js-fund", name: "JavaScript Fundamentals", provider: "freeCodeCamp", durationHours: 30, url: "https://www.freecodecamp.org" },
  { id: "c-react-complete", name: "Complete React Developer", provider: "Udemy", durationHours: 50, url: "https://www.udemy.com" },
  { id: "c-ts-master", name: "TypeScript Masterclass", provider: "Frontend Masters", durationHours: 12, url: "https://frontendmasters.com" },
  { id: "c-node-pro", name: "Node.js Professional", provider: "Pluralsight", durationHours: 25, url: "https://www.pluralsight.com" },
  { id: "c-sql-boot", name: "SQL Bootcamp", provider: "Udemy", durationHours: 20, url: "https://www.udemy.com" },
  { id: "c-graph-neo4j", name: "Neo4j Graph Academy", provider: "Neo4j", durationHours: 15, url: "https://graphacademy.neo4j.com" },
  { id: "c-ml-andrew", name: "Machine Learning Specialization", provider: "Coursera", durationHours: 80, url: "https://www.coursera.org/specializations/machine-learning" },
  { id: "c-dl-fastai", name: "Practical Deep Learning", provider: "fast.ai", durationHours: 60, url: "https://course.fast.ai" },
  { id: "c-llm-deeplearning", name: "LLM Engineering", provider: "DeepLearning.AI", durationHours: 20, url: "https://www.deeplearning.ai" },
  { id: "c-docker-k8s", name: "Docker & Kubernetes", provider: "KodeKloud", durationHours: 35, url: "https://kodekloud.com" },
  { id: "c-aws-saa", name: "AWS Solutions Architect", provider: "A Cloud Guru", durationHours: 45, url: "https://acloudguru.com" },
  { id: "c-sysdesign", name: "System Design Interview", provider: "Educative", durationHours: 30, url: "https://www.educative.io" },
  { id: "c-algo-ds", name: "Algorithms & Data Structures", provider: "LeetCode", durationHours: 100, url: "https://leetcode.com" },
  { id: "c-cypher-cognodb", name: "Cypher & Graph Modeling", provider: "CognoDB", durationHours: 8, url: "https://cognodb.com/docs" },
];

export const people: PersonSeed[] = [
  { id: "p-alice", name: "Alice Chen", bio: "Full stack developer turned AI engineer with 8 years of experience." },
  { id: "p-bob", name: "Bob Martinez", bio: "Data engineer specializing in graph analytics pipelines." },
  { id: "p-carol", name: "Carol Okonkwo", bio: "ML engineer focused on production NLP systems." },
  { id: "p-david", name: "David Kim", bio: "DevOps lead with expertise in cloud-native architectures." },
  { id: "p-eve", name: "Eve Thompson", bio: "Frontend specialist and design systems advocate." },
];

/** PREREQUISITE_FOR: from -> to (source must be learned before target) */
export const prerequisites: Array<[string, string]> = [
  ["html-css", "javascript"],
  ["javascript", "typescript"],
  ["javascript", "react"],
  ["javascript", "nodejs"],
  ["typescript", "react"],
  ["python", "statistics"],
  ["python", "machine-learning"],
  ["statistics", "machine-learning"],
  ["machine-learning", "deep-learning"],
  ["deep-learning", "nlp"],
  ["nlp", "llm-engineering"],
  ["prompt-engineering", "llm-engineering"],
  ["python", "prompt-engineering"],
  ["sql", "postgresql"],
  ["data-structures", "algorithms"],
  ["algorithms", "system-design"],
  ["python", "data-structures"],
  ["docker", "kubernetes"],
  ["linux", "docker"],
  ["networking", "system-design"],
  ["aws", "kubernetes"],
  ["nodejs", "api-design"],
  ["postgresql", "graph-db"],
  ["graph-db", "cypher"],
];

export const prerequisitesFixed: Array<[string, string]> = prerequisites;

/** RELATED_TO: bidirectional skill associations */
export const relatedSkills: Array<[string, string]> = [
  ["react", "nodejs"],
  ["mongodb", "nodejs"],
  ["postgresql", "python"],
  ["docker", "aws"],
  ["testing", "git"],
  ["api-design", "system-design"],
  ["nlp", "prompt-engineering"],
  ["graph-db", "data-structures"],
  ["cybersecurity", "networking"],
  ["agile", "testing"],
];

/** REQUIRES: roleId -> [skillId, importance] */
export const roleRequirements: Array<[string, string, "essential" | "recommended"]> = [
  ["frontend-dev", "html-css", "essential"],
  ["frontend-dev", "javascript", "essential"],
  ["frontend-dev", "react", "essential"],
  ["frontend-dev", "typescript", "recommended"],
  ["frontend-dev", "git", "essential"],
  ["frontend-dev", "testing", "recommended"],
  ["backend-dev", "python", "recommended"],
  ["backend-dev", "javascript", "essential"],
  ["backend-dev", "nodejs", "essential"],
  ["backend-dev", "sql", "essential"],
  ["backend-dev", "postgresql", "essential"],
  ["backend-dev", "api-design", "essential"],
  ["backend-dev", "docker", "recommended"],
  ["fullstack-dev", "javascript", "essential"],
  ["fullstack-dev", "react", "essential"],
  ["fullstack-dev", "nodejs", "essential"],
  ["fullstack-dev", "postgresql", "essential"],
  ["fullstack-dev", "docker", "recommended"],
  ["fullstack-dev", "git", "essential"],
  ["data-engineer", "python", "essential"],
  ["data-engineer", "sql", "essential"],
  ["data-engineer", "postgresql", "essential"],
  ["data-engineer", "aws", "recommended"],
  ["data-engineer", "docker", "recommended"],
  ["data-scientist", "python", "essential"],
  ["data-scientist", "statistics", "essential"],
  ["data-scientist", "machine-learning", "essential"],
  ["data-scientist", "sql", "essential"],
  ["ml-engineer", "python", "essential"],
  ["ml-engineer", "machine-learning", "essential"],
  ["ml-engineer", "deep-learning", "essential"],
  ["ml-engineer", "docker", "essential"],
  ["ml-engineer", "aws", "recommended"],
  ["ml-engineer", "system-design", "recommended"],
  ["ai-engineer", "python", "essential"],
  ["ai-engineer", "llm-engineering", "essential"],
  ["ai-engineer", "prompt-engineering", "essential"],
  ["ai-engineer", "nlp", "essential"],
  ["ai-engineer", "api-design", "essential"],
  ["ai-engineer", "system-design", "recommended"],
  ["devops-engineer", "linux", "essential"],
  ["devops-engineer", "docker", "essential"],
  ["devops-engineer", "kubernetes", "essential"],
  ["devops-engineer", "aws", "essential"],
  ["devops-engineer", "networking", "recommended"],
  ["graph-engineer", "graph-db", "essential"],
  ["graph-engineer", "cypher", "essential"],
  ["graph-engineer", "python", "essential"],
  ["graph-engineer", "data-structures", "essential"],
  ["graph-engineer", "api-design", "recommended"],
  ["solutions-architect", "system-design", "essential"],
  ["solutions-architect", "aws", "essential"],
  ["solutions-architect", "networking", "essential"],
  ["solutions-architect", "docker", "recommended"],
  ["solutions-architect", "kubernetes", "recommended"],
  ["solutions-architect", "api-design", "essential"],
];

/** TEACHES: courseId -> [skillId, proficiency] */
export const courseTeaches: Array<[string, string, "beginner" | "intermediate" | "advanced"]> = [
  ["c-py-101", "python", "beginner"],
  ["c-js-fund", "javascript", "beginner"],
  ["c-js-fund", "html-css", "beginner"],
  ["c-react-complete", "react", "intermediate"],
  ["c-react-complete", "javascript", "intermediate"],
  ["c-ts-master", "typescript", "intermediate"],
  ["c-node-pro", "nodejs", "intermediate"],
  ["c-node-pro", "api-design", "intermediate"],
  ["c-sql-boot", "sql", "beginner"],
  ["c-sql-boot", "postgresql", "intermediate"],
  ["c-graph-neo4j", "graph-db", "intermediate"],
  ["c-graph-neo4j", "cypher", "intermediate"],
  ["c-cypher-cognodb", "cypher", "intermediate"],
  ["c-cypher-cognodb", "graph-db", "beginner"],
  ["c-ml-andrew", "machine-learning", "intermediate"],
  ["c-ml-andrew", "statistics", "intermediate"],
  ["c-dl-fastai", "deep-learning", "advanced"],
  ["c-llm-deeplearning", "llm-engineering", "advanced"],
  ["c-llm-deeplearning", "prompt-engineering", "intermediate"],
  ["c-docker-k8s", "docker", "intermediate"],
  ["c-docker-k8s", "kubernetes", "advanced"],
  ["c-aws-saa", "aws", "intermediate"],
  ["c-sysdesign", "system-design", "advanced"],
  ["c-algo-ds", "algorithms", "intermediate"],
  ["c-algo-ds", "data-structures", "intermediate"],
];

/** Person skills: personId -> [skillId, level 1-5] */
export const personSkills: Array<[string, string, number]> = [
  ["p-alice", "javascript", 5],
  ["p-alice", "react", 5],
  ["p-alice", "python", 4],
  ["p-alice", "llm-engineering", 4],
  ["p-alice", "prompt-engineering", 5],
  ["p-bob", "python", 5],
  ["p-bob", "graph-db", 5],
  ["p-bob", "cypher", 5],
  ["p-bob", "postgresql", 4],
  ["p-carol", "python", 5],
  ["p-carol", "machine-learning", 5],
  ["p-carol", "nlp", 4],
  ["p-carol", "deep-learning", 4],
  ["p-david", "docker", 5],
  ["p-david", "kubernetes", 5],
  ["p-david", "aws", 5],
  ["p-david", "linux", 4],
  ["p-eve", "html-css", 5],
  ["p-eve", "react", 5],
  ["p-eve", "typescript", 4],
  ["p-eve", "testing", 4],
];

/** Person roles: personId -> [roleId, years] */
export const personRoles: Array<[string, string, number]> = [
  ["p-alice", "fullstack-dev", 4],
  ["p-alice", "ai-engineer", 2],
  ["p-bob", "graph-engineer", 5],
  ["p-bob", "data-engineer", 3],
  ["p-carol", "ml-engineer", 4],
  ["p-carol", "data-scientist", 2],
  ["p-david", "devops-engineer", 6],
  ["p-david", "solutions-architect", 2],
  ["p-eve", "frontend-dev", 5],
];
