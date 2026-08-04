import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useQuery } from "../hooks/useQuery";
import { LoadingState, ErrorState, EmptyState, formatSalary } from "../components/ui";

export function RolesPage() {
  const { data: roles, loading, error, errorCode, refetch } = useQuery(() => api.roles(), []);

  if (loading) return <LoadingState message="Loading roles..." />;
  if (error)
    return (
      <ErrorState message={error} isDatabaseError={errorCode === "DATABASE_UNAVAILABLE"} onRetry={refetch} />
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Career Roles</h1>
        <p className="mt-1 text-sm text-slate-400">
          Explore tech roles and their skill requirements in the graph.
        </p>
      </div>

      {!roles?.length ? (
        <EmptyState title="No roles found" description="Run the seed script to populate career data." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <Link
              key={role.id}
              to={`/roles/${role.id}`}
              className="card group p-5 transition hover:border-brand-500/30"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-white group-hover:text-brand-300">{role.name}</h3>
                <span className="badge bg-violet-500/15 text-violet-300">{role.level}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{role.description}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>{formatSalary(role.salaryMin, role.salaryMax)}</span>
                <span>{role.skillCount ?? 0} skills required</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
