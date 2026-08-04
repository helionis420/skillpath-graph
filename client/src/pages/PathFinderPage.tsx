import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowRight, Route, GitBranch } from "lucide-react";
import { api, PathStep, BridgeSkill } from "../api/client";
import { useQuery, useMutation } from "../hooks/useQuery";
import { ErrorState, EmptyState, DifficultyBadge } from "../components/ui";

export function PathFinderPage() {
  const [searchParams] = useSearchParams();
  const [fromSkill, setFromSkill] = useState(searchParams.get("from") ?? "");
  const [toSkill, setToSkill] = useState(searchParams.get("to") ?? "");
  const [role1, setRole1] = useState("");
  const [role2, setRole2] = useState("");
  const [path, setPath] = useState<PathStep[] | null>(null);
  const [bridges, setBridges] = useState<BridgeSkill[] | null>(null);

  const { data: skills } = useQuery(() => api.skills(), []);
  const { data: roles } = useQuery(() => api.roles(), []);

  const pathMutation = useMutation((from: string, to: string) => api.learningPath(from, to));
  const bridgeMutation = useMutation((r1: string, r2: string) => api.bridgeSkills(r1, r2));

  useEffect(() => {
    const from = searchParams.get("from");
    if (from) setFromSkill(from);
  }, [searchParams]);

  const handleFindPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromSkill || !toSkill) return;
    try {
      const result = await pathMutation.mutate(fromSkill, toSkill);
      setPath(result);
    } catch {
      setPath(null);
    }
  };

  const handleFindBridges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role1 || !role2) return;
    try {
      const result = await bridgeMutation.mutate(role1, role2);
      setBridges(result);
    } catch {
      setBridges(null);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white">Path Finder</h1>
        <p className="mt-1 text-sm text-slate-400">
          Multi-hop graph traversals to discover learning paths and bridge skills between careers.
        </p>
      </div>

      {/* Learning Path */}
      <section className="card p-6">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-brand-400" />
          <h2 className="text-lg font-semibold text-white">Shortest Learning Path</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Finds the shortest path between two skills via PREREQUISITE_FOR and RELATED_TO (2+ hops).
        </p>

        <form onSubmit={handleFindPath} className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto]">
          <select
            value={fromSkill}
            onChange={(e) => setFromSkill(e.target.value)}
            className="input-field"
            required
          >
            <option value="">From skill...</option>
            {skills?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="hidden items-center justify-center sm:flex">
            <ArrowRight className="h-5 w-5 text-slate-500" />
          </div>
          <select
            value={toSkill}
            onChange={(e) => setToSkill(e.target.value)}
            className="input-field"
            required
          >
            <option value="">To skill...</option>
            {skills?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary" disabled={pathMutation.loading}>
            {pathMutation.loading ? "Searching..." : "Find path"}
          </button>
        </form>

        {pathMutation.error && (
          <ErrorState
            title="Path query failed"
            message={pathMutation.error}
            isDatabaseError={pathMutation.errorCode === "DATABASE_UNAVAILABLE"}
          />
        )}

        {path !== null && !pathMutation.loading && (
          <div className="mt-6">
            {path.length === 0 ? (
              <EmptyState
                title="No path found"
                description="These skills may not be connected in the graph. Try different skills or check seed data."
              />
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-brand-500/30" />
                <ol className="space-y-4">
                  {path.map((step, i) => (
                    <li key={`${step.id}-${i}`} className="relative pl-10">
                      <div className="absolute left-2.5 flex h-3 w-3 items-center justify-center rounded-full bg-brand-500 ring-4 ring-surface-raised" />
                      <Link
                        to={`/skills/${step.id}`}
                        className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-slate-700 bg-surface px-4 py-3 transition hover:border-brand-500/30"
                      >
                        <span className="font-medium text-white">{step.name}</span>
                        <DifficultyBadge difficulty={step.difficulty} />
                        <span className="text-xs text-slate-500">{step.category}</span>
                      </Link>
                      {step.relType && i < path.length - 1 && (
                        <p className="mt-1 pl-1 text-xs text-brand-400/70">via {step.relType}</p>
                      )}
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-sm text-slate-500">
                  Path length: {path.length} skill{path.length !== 1 ? "s" : ""} ({path.length - 1} hop
                  {path.length - 1 !== 1 ? "s" : ""})
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Bridge Skills */}
      <section className="card p-6">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Bridge Skills Between Roles</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Relationally awkward query: find skills connecting requirements of two different careers.
        </p>

        <form onSubmit={handleFindBridges} className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <select value={role1} onChange={(e) => setRole1(e.target.value)} className="input-field" required>
            <option value="">First role...</option>
            {roles?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select value={role2} onChange={(e) => setRole2(e.target.value)} className="input-field" required>
            <option value="">Second role...</option>
            {roles?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary" disabled={bridgeMutation.loading}>
            {bridgeMutation.loading ? "Searching..." : "Find bridges"}
          </button>
        </form>

        {bridgeMutation.error && (
          <ErrorState
            title="Bridge query failed"
            message={bridgeMutation.error}
            isDatabaseError={bridgeMutation.errorCode === "DATABASE_UNAVAILABLE"}
          />
        )}

        {bridges !== null && !bridgeMutation.loading && (
          <div className="mt-6">
            {bridges.length === 0 ? (
              <EmptyState title="No bridge skills found" description="Try selecting different role pairs." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {bridges.map((b) => (
                  <Link
                    key={b.id}
                    to={`/skills/${b.id}`}
                    className="rounded-lg border border-slate-700 bg-surface p-4 transition hover:border-violet-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{b.name}</span>
                      <span className="text-xs text-slate-500">{b.pathLength} hops</span>
                    </div>
                    <p className="mt-1 text-xs text-violet-400">{b.category}</p>
                    {b.courses?.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500">{b.courses.length} course(s)</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
