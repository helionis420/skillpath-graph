import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api } from "../api/client";
import { useQuery } from "../hooks/useQuery";
import {
  LoadingState,
  ErrorState,
  ImportanceBadge,
  DifficultyBadge,
  formatSalary,
} from "../components/ui";

export function RoleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: role, loading, error, errorCode, refetch } = useQuery(
    () => api.role(id!),
    [id]
  );

  if (loading) return <LoadingState message="Loading role details..." />;
  if (error)
    return (
      <ErrorState message={error} isDatabaseError={errorCode === "DATABASE_UNAVAILABLE"} onRetry={refetch} />
    );
  if (!role) return <ErrorState title="Not found" message="This role does not exist in the graph." />;

  const essential = role.requiredSkills?.filter((s) => s.importance === "essential") ?? [];
  const recommended = role.requiredSkills?.filter((s) => s.importance === "recommended") ?? [];

  return (
    <div className="space-y-8">
      <Link to="/roles" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-brand-400">
        <ArrowLeft className="h-4 w-4" /> Back to roles
      </Link>

      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-white">{role.name}</h1>
          <span className="badge bg-violet-500/15 text-violet-300">{role.level}</span>
        </div>
        <p className="mt-4 text-slate-300">{role.description}</p>
        <p className="mt-3 text-sm text-brand-300">{formatSalary(role.salaryMin, role.salaryMax)}</p>
        <Link to={`/matcher?role=${role.id}`} className="btn-primary mt-6 inline-flex">
          Match my skills to this role
        </Link>
      </div>

      {essential.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-white">Essential skills</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {essential.map((s) => (
              <Link
                key={s.id}
                to={`/skills/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-surface px-4 py-3 transition hover:border-brand-500/30"
              >
                <div>
                  <span className="text-sm font-medium text-slate-200">{s.name}</span>
                  <p className="text-xs text-slate-500">{s.category}</p>
                </div>
                <DifficultyBadge difficulty={s.difficulty} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {recommended.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-white">Recommended skills</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {recommended.map((s) => (
              <Link
                key={s.id}
                to={`/skills/${s.id}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-brand-500/30"
              >
                {s.name}
                <ImportanceBadge importance={s.importance} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
