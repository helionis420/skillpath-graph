import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "../api/client";
import { useQuery } from "../hooks/useQuery";
import { LoadingState, ErrorState, DifficultyBadge, ImportanceBadge } from "../components/ui";

export function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: skill, loading, error, errorCode, refetch } = useQuery(
    () => api.skill(id!),
    [id]
  );

  if (loading) return <LoadingState message="Loading skill details..." />;
  if (error)
    return (
      <ErrorState message={error} isDatabaseError={errorCode === "DATABASE_UNAVAILABLE"} onRetry={refetch} />
    );
  if (!skill)
    return <ErrorState title="Not found" message="This skill does not exist in the graph." />;

  return (
    <div className="space-y-8">
      <Link to="/skills" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-400">
        <ArrowLeft className="h-4 w-4" /> Back to skills
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{skill.name}</h1>
          <DifficultyBadge difficulty={skill.difficulty} />
          <span className="badge bg-brand-500/10 text-brand-300">{skill.category}</span>
        </div>
        <p className="mt-4 text-slate-300">{skill.description}</p>
        <Link
          to={`/pathfinder?from=${skill.id}`}
          className="btn-primary mt-6 inline-flex"
        >
          Find paths from this skill <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold text-white">Prerequisites</h2>
          <p className="mt-1 text-xs text-slate-500">Skills you should learn first</p>
          {skill.prerequisites?.length ? (
            <ul className="mt-4 space-y-2">
              {skill.prerequisites.map((p) => (
                <li key={p.id}>
                  <Link to={`/skills/${p.id}`} className="text-sm text-brand-400 hover:underline">
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No prerequisites — great starting point!</p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-semibold text-white">Unlocks</h2>
          <p className="mt-1 text-xs text-slate-500">Skills this enables you to learn next</p>
          {skill.unlocks?.length ? (
            <ul className="mt-4 space-y-2">
              {skill.unlocks.map((u) => (
                <li key={u.id}>
                  <Link to={`/skills/${u.id}`} className="text-sm text-brand-400 hover:underline">
                    {u.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No direct follow-up skills mapped.</p>
          )}
        </section>
      </div>

      {skill.roles?.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-white">Required by roles</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {skill.roles.map((r) => (
              <Link
                key={r.id}
                to={`/roles/${r.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-surface px-3 py-2 text-sm transition hover:border-brand-500/30"
              >
                {r.name}
                <ImportanceBadge importance={r.importance} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {skill.courses?.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-white">Courses</h2>
          <ul className="mt-4 space-y-3">
            {skill.courses.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{c.name}</span>
                <span className="text-slate-500">{c.provider}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
