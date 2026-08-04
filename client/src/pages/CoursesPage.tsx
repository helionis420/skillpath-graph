import { ExternalLink } from "lucide-react";
import { api } from "../api/client";
import { useQuery } from "../hooks/useQuery";
import { LoadingState, ErrorState, EmptyState } from "../components/ui";
import { Link } from "react-router-dom";

export function CoursesPage() {
  const { data: courses, loading, error, errorCode, refetch } = useQuery(() => api.courses(), []);

  if (loading) return <LoadingState message="Loading courses..." />;
  if (error)
    return (
      <ErrorState message={error} isDatabaseError={errorCode === "DATABASE_UNAVAILABLE"} onRetry={refetch} />
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Courses</h1>
        <p className="mt-1 text-sm text-slate-400">
          Learning resources connected to skills via TEACHES relationships.
        </p>
      </div>

      {!courses?.length ? (
        <EmptyState title="No courses found" description="Run the seed script to populate course data." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <article key={course.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-white">{course.name}</h3>
                <a
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-brand-400 hover:text-brand-300"
                  aria-label={`Open ${course.name}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-1 text-sm text-slate-400">{course.provider}</p>
              <p className="mt-2 text-xs text-slate-500">{course.durationHours} hours</p>
              {course.skills?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {course.skills.map((s) => (
                    <Link
                      key={s.id}
                      to={`/skills/${s.id}`}
                      className="rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs text-brand-300 hover:bg-brand-500/20"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
