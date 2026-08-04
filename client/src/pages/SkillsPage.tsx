import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useQuery } from "../hooks/useQuery";
import { LoadingState, ErrorState, EmptyState, DifficultyBadge } from "../components/ui";

export function SkillsPage() {
  const [category, setCategory] = useState<string>("");
  const { data: categories } = useQuery(() => api.categories(), []);
  const { data: skills, loading, error, errorCode, refetch } = useQuery(
    () => api.skills(category || undefined),
    [category]
  );

  if (loading) return <LoadingState message="Loading skills..." />;
  if (error)
    return (
      <ErrorState message={error} isDatabaseError={errorCode === "DATABASE_UNAVAILABLE"} onRetry={refetch} />
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Skills</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse {skills?.length ?? 0} skills and their connections in the graph.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory("")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            !category ? "bg-brand-600 text-white" : "bg-surface-raised text-slate-400 hover:text-slate-200"
          }`}
        >
          All
        </button>
        {categories?.map((c) => (
          <button
            key={c.category}
            onClick={() => setCategory(c.category)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              category === c.category
                ? "bg-brand-600 text-white"
                : "bg-surface-raised text-slate-400 hover:text-slate-200"
            }`}
          >
            {c.category}
          </button>
        ))}
      </div>

      {!skills?.length ? (
        <EmptyState
          title="No skills found"
          description={category ? `No skills in the "${category}" category.` : "Run the seed script to populate data."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              to={`/skills/${skill.id}`}
              className="card group p-5 transition hover:border-brand-500/30"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white group-hover:text-brand-300">{skill.name}</h3>
                <DifficultyBadge difficulty={skill.difficulty} />
              </div>
              <p className="mt-1 text-xs text-brand-400/80">{skill.category}</p>
              {skill.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-400">{skill.description}</p>
              )}
              {skill.courseCount !== undefined && skill.courseCount > 0 && (
                <p className="mt-3 text-xs text-slate-500">{skill.courseCount} course(s) available</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
