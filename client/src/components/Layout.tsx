import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Brain,
  Briefcase,
  Route,
  Target,
  BookOpen,
  Search,
  GitBranch,
  Circle,
} from "lucide-react";
import { api } from "../api/client";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/skills", label: "Skills", icon: Brain },
  { to: "/roles", label: "Roles", icon: Briefcase },
  { to: "/pathfinder", label: "Path Finder", icon: Route },
  { to: "/matcher", label: "Role Matcher", icon: Target },
  { to: "/courses", label: "Courses", icon: BookOpen },
];

export function Layout() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    api.health().then((h) => setDbConnected(h.database?.connected ?? false)).catch(() => setDbConnected(false));
    const interval = setInterval(() => {
      api.health().then((h) => setDbConnected(h.database?.connected ?? false)).catch(() => setDbConnected(false));
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface to-brand-950/30">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-tight text-white">SkillPath</span>
              <span className="ml-1.5 text-xs text-brand-400">Graph</span>
            </div>
          </NavLink>

          <form onSubmit={handleSearch} className="hidden flex-1 md:block md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                placeholder="Search skills and roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            <Circle
              className={`h-2 w-2 fill-current ${
                dbConnected === null
                  ? "text-slate-500"
                  : dbConnected
                    ? "text-emerald-400"
                    : "text-red-400"
              }`}
            />
            <span>
              {dbConnected === null ? "Checking..." : dbConnected ? "CognoDB connected" : "DB offline"}
            </span>
          </div>
        </div>

        <nav className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
          <div className="flex gap-1 pb-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-600/20 text-brand-300"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800/50 py-6 text-center text-xs text-slate-500">
        SkillPath Graph · Powered by{" "}
        <a href="https://cognodb.com" className="text-brand-400 hover:underline" target="_blank" rel="noreferrer">
          CognoDB
        </a>{" "}
        · Wexa AI Take-Home Assignment
      </footer>
    </div>
  );
}
