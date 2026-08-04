import { useSearchParams, Link } from "react-router-dom";
import { Brain, Briefcase } from "lucide-react";
import { api } from "../api/client";
import { useQuery } from "../hooks/useQuery";
import { LoadingState, ErrorState, EmptyState } from "../components/ui";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const { data: results, loading, error, errorCode, refetch } = useQuery(
    () => (query ? api.search(query) : Promise.resolve([])),
    [query]
  );

  if (!query) {
    return (
      <EmptyState
        title="Enter a search term"
        description="Use the search bar in the header to find skills and roles."
      />
    );
  }

  if (loading) return <LoadingState message={`Searching for "${query}"...`} />;
  if (error)
    return (
      <ErrorState message={error} isDatabaseError={errorCode === "DATABASE_UNAVAILABLE"} onRetry={refetch} />
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Search results</h1>
        <p className="mt-1 text-sm text-slate-400">
          {results?.length ?? 0} result(s) for &quot;{query}&quot;
        </p>
      </div>

      {!results?.length ? (
        <EmptyState
          title="No results"
          description={`Nothing matched "${query}". Try a different term.`}
        />
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <Link
              key={`${r.type}-${r.id}`}
              to={r.type === "skill" ? `/skills/${r.id}` : `/roles/${r.id}`}
              className="card flex items-start gap-4 p-4 transition hover:border-brand-500/30"
            >
              <div className="rounded-lg bg-surface p-2">
                {r.type === "skill" ? (
                  <Brain className="h-5 w-5 text-brand-400" />
                ) : (
                  <Briefcase className="h-5 w-5 text-violet-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{r.name}</h3>
                  <span className="badge bg-slate-700 text-slate-400">{r.type}</span>
                </div>
                <p className="text-sm text-brand-400/80">{r.subtitle}</p>
                {r.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">{r.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
