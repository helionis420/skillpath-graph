import { Loader2, AlertTriangle, Database, RefreshCw } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon ?? <Database className="h-10 w-10 text-slate-600" />}
      <h3 className="text-lg font-medium text-slate-300">{title}</h3>
      <p className="max-w-md text-sm text-slate-500">{description}</p>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  isDatabaseError?: boolean;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  isDatabaseError,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="rounded-full bg-red-500/10 p-3">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <div>
        <h3 className="text-lg font-medium text-slate-200">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-slate-400">{message}</p>
        {isDatabaseError && (
          <p className="mt-2 text-xs text-slate-500">
            Check that CognoDB is running and your .env credentials are correct.
          </p>
        )}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}

interface DifficultyBadgeProps {
  difficulty: string;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const colors: Record<string, string> = {
    beginner: "bg-emerald-500/15 text-emerald-400",
    intermediate: "bg-amber-500/15 text-amber-400",
    advanced: "bg-rose-500/15 text-rose-400",
  };
  return (
    <span className={`badge ${colors[difficulty] ?? "bg-slate-500/15 text-slate-400"}`}>
      {difficulty}
    </span>
  );
}

interface ImportanceBadgeProps {
  importance: string;
}

export function ImportanceBadge({ importance }: ImportanceBadgeProps) {
  const isEssential = importance === "essential";
  return (
    <span
      className={`badge ${
        isEssential ? "bg-brand-500/15 text-brand-300" : "bg-slate-500/15 text-slate-400"
      }`}
    >
      {importance}
    </span>
  );
}

export function MatchBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all"
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-brand-300">{percent}%</span>
    </div>
  );
}

export function formatSalary(min: number, max: number): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  return `${fmt(min)} – ${fmt(max)}`;
}
