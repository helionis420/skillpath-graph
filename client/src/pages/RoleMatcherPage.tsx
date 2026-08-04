import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Check, X } from "lucide-react";
import { api, Skill, RoleMatch } from "../api/client";
import { useQuery, useMutation } from "../hooks/useQuery";
import { LoadingState, ErrorState, EmptyState, MatchBar, formatSalary } from "../components/ui";

export function RoleMatcherPage() {
  const [searchParams] = useSearchParams();
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [matches, setMatches] = useState<RoleMatch[] | null>(null);

  const { data: skills, loading, error, errorCode, refetch } = useQuery(() => api.skills(), []);
  const matchMutation = useMutation((ids: string[]) => api.matchRoles(ids));

  useEffect(() => {
    const role = searchParams.get("role");
    if (role) {
      api.role(role).then((r) => {
        const essential = r.requiredSkills
          ?.filter((s) => s.importance === "essential")
          .map((s) => s.id) ?? [];
        setSelectedSkills(new Set(essential.slice(0, 3)));
      }).catch(() => {});
    }
  }, [searchParams]);

  const toggleSkill = (id: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMatch = async () => {
    if (selectedSkills.size === 0) return;
    try {
      const result = await matchMutation.mutate([...selectedSkills]);
      setMatches(result);
    } catch {
      setMatches(null);
    }
  };

  const grouped = skills?.reduce<Record<string, Skill[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {}) ?? {};

  if (loading) return <LoadingState message="Loading skills..." />;
  if (error)
    return (
      <ErrorState message={error} isDatabaseError={errorCode === "DATABASE_UNAVAILABLE"} onRetry={refetch} />
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Role Matcher</h1>
        <p className="mt-1 text-sm text-slate-400">
          Select skills you have — the graph scores roles by matching requirements including prerequisite chains.
        </p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-white">Your skills</h2>
        <p className="mt-1 text-xs text-slate-500">
          Click to toggle. The matcher considers direct skills and up to 4 hops of prerequisites.
        </p>

        <div className="mt-6 max-h-96 space-y-6 overflow-y-auto pr-2">
          {Object.entries(grouped).map(([category, categorySkills]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{category}</h3>
              <div className="flex flex-wrap gap-2">
                {categorySkills.map((s) => {
                  const selected = selectedSkills.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSkill(s.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                        selected
                          ? "bg-brand-600 text-white"
                          : "border border-slate-700 bg-surface text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 opacity-0" />}
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleMatch}
            className="btn-primary"
            disabled={selectedSkills.size === 0 || matchMutation.loading}
          >
            {matchMutation.loading ? "Matching..." : `Match ${selectedSkills.size} skill(s) to roles`}
          </button>
          {selectedSkills.size > 0 && (
            <button onClick={() => setSelectedSkills(new Set())} className="btn-secondary text-sm">
              Clear all
            </button>
          )}
        </div>
      </section>

      {matchMutation.error && (
        <ErrorState
          title="Match query failed"
          message={matchMutation.error}
          isDatabaseError={matchMutation.errorCode === "DATABASE_UNAVAILABLE"}
        />
      )}

      {matches !== null && !matchMutation.loading && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Matching roles</h2>
          {matches.length === 0 ? (
            <EmptyState
              title="No matching roles"
              description="Try adding more skills or skills that are prerequisites for role requirements."
            />
          ) : (
            <div className="space-y-4">
              {matches.map((m) => (
                <Link
                  key={m.id}
                  to={`/roles/${m.id}`}
                  className="card block p-5 transition hover:border-brand-500/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white">{m.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {m.level} · {formatSalary(m.salaryMin, m.salaryMax)}
                      </p>
                    </div>
                    <div className="w-full sm:w-48">
                      <MatchBar percent={Number(m.matchPercent)} />
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Score {m.matchScore} · {m.totalRequired} skills required ({m.essentialCount} essential)
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
