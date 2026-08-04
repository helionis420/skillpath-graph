import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { SkillsPage } from "./pages/SkillsPage";
import { SkillDetailPage } from "./pages/SkillDetailPage";
import { RolesPage } from "./pages/RolesPage";
import { RoleDetailPage } from "./pages/RoleDetailPage";
import { PathFinderPage } from "./pages/PathFinderPage";
import { RoleMatcherPage } from "./pages/RoleMatcherPage";
import { CoursesPage } from "./pages/CoursesPage";
import { SearchPage } from "./pages/SearchPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="skills/:id" element={<SkillDetailPage />} />
        <Route path="roles" element={<RolesPage />} />
        <Route path="roles/:id" element={<RoleDetailPage />} />
        <Route path="pathfinder" element={<PathFinderPage />} />
        <Route path="matcher" element={<RoleMatcherPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="search" element={<SearchPage />} />
      </Route>
    </Routes>
  );
}
