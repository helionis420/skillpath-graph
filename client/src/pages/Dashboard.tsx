import { Link } from "react-router-dom";
import {
  Brain,
  Briefcase,
  BookOpen,
  Users,
  Share2,
  Route,
  Target,
  ArrowRight,
} from "lucide-react";
import { api, toNumber } from "../api/client";
import { useQuery } from "../hooks/useQuery";
import { LoadingState, ErrorState } from "../components/ui";

export function Dashboard() {
  const { data: stats, loading, error, errorCode, refetch } = useQuery(() => api.stats(), []);

  if (loading) return <LoadingState message="Loading graph statistics..." />;
  if (error)
    return (
      <ErrorState
        message={error}
        isDatabaseError={errorCode === "DATABASE_UNAVAILABLE"}
        onRetry={refetch}
      />
    );

  const statCards = [
    { label: "Skills", value: toNumber(stats?.skills), icon: Brain, color: "text-brand-400", to: "/skills" },
    { label: "Roles", value: toNumber(stats?.roles), icon: Briefcase, color: "text-violet-400", to: "/roles" },
    { label: "Courses", value: toNumber(stats?.courses), icon: BookOpen, color: "text-cyan-400", to: "/courses" },
    { label: "People", value: toNumber(stats?.people), icon: Users, color: "text-amber-400", to: "/skills" },
    { label: "Relationships", value: toNumber(stats?.relationships), icon: Share2, color: "text-emerald-400", to: "/pathfinder" },
  ];

  const features = [
    {
      title: "Learning Path Finder",
      description: "Find the shortest skill path between any two skills using multi-hop graph traversal.",
      icon: Route,
      to: "/pathfinder",
    },
    {
      title: "Role Matcher",
      description: "Discover careers that match your skills, including prerequisite-aware scoring.",
      icon: Target,
      to: "/matcher",
    },
  ];

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Career & Skills Graph Explorer
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          Navigate the interconnected world of tech skills, career roles, and learning resources.
          Built on a graph database where relationships are first-class citizens.
        </p>
      </section>

      {toNumber(stats?.skills) === 0 ? (
        <div className="card border-amber-500/30 bg-amber-500/5 p-6">
          <h3 className="font-medium text-amber-300">Database is empty</h3>
          <p className="mt-1 text-sm text-slate-400">
            Run <code className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-200">npm run seed</code> from the
            project root to load sample data into CognoDB.
          </p>
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map(({ label, value, icon: Icon, color, to }) => (
            <Link key={label} to={to} className="card group p-5 transition hover:border-brand-500/30">
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${color}`} />
                <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:text-brand-400" />
              </div>
              <p className="mt-4 text-3xl font-bold text-white">{value}</p>
              <p className="text-sm text-slate-400">{label}</p>
            </Link>
          ))}
        </section>
      )}

      <section className="grid gap-6 md:grid-cols-2">
        {features.map(({ title, description, icon: Icon, to }) => (
          <Link key={to} to={to} className="card group p-6 transition hover:border-brand-500/30">
            <Icon className="h-8 w-8 text-brand-400" />
            <h2 className="mt-4 text-xl font-semibold text-white group-hover:text-brand-300">{title}</h2>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm text-brand-400">
              Explore <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="text-lg font-semibold text-white">Why a graph database?</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Skills form prerequisite chains, roles require overlapping skill sets, and learning paths are naturally
          modeled as traversals. Queries like &quot;shortest path from Python to LLM Engineering&quot; or
          &quot;which roles match my skills including prerequisites?&quot; are awkward in SQL but natural in
          Cypher — a few lines of pattern matching replace recursive CTEs and multiple JOINs.
        </p>
      </section>
    </div>
  );
}
