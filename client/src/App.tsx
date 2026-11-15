import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { useAuth } from "./context/AuthContext";
import { Spinner } from "./components/ui";

import Home from "./pages/Home";
import Writeups from "./pages/Writeups";
import Tutorials from "./pages/Tutorials";
import News from "./pages/News";
import About from "./pages/About";
import SearchPage from "./pages/Search";
import NotFound from "./pages/NotFound";

// The article renderer (Markdown + Prism) and the whole admin desk are split
// out of the initial bundle; the landing pages do not need either.
const ArticlePage = lazy(() => import("./pages/Article"));
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminArticles = lazy(() => import("./pages/admin/Articles"));
const ArticleEditor = lazy(() => import("./pages/admin/ArticleEditor"));
const Taxonomy = lazy(() => import("./pages/admin/Taxonomy"));

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="shell py-20">
        <Spinner label="Checking session" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="shell py-20">
          <Spinner label="Loading" />
        </div>
      }
    >
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="writeups" element={<Writeups />} />
          <Route path="writeups/:platform/:slug" element={<ArticlePage />} />
          <Route path="writeups/:slug" element={<ArticlePage />} />
          <Route path="tutorials" element={<Tutorials />} />
          <Route path="tutorials/:slug" element={<ArticlePage />} />
          <Route path="news" element={<News />} />
          <Route path="news/:slug" element={<ArticlePage />} />
          <Route path="journal/:slug" element={<ArticlePage />} />
          <Route path="about" element={<About />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <Protected>
              <AdminLayout />
            </Protected>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="articles" element={<AdminArticles />} />
          <Route path="articles/new" element={<ArticleEditor />} />
          <Route path="articles/:id/edit" element={<ArticleEditor />} />
          <Route path="taxonomy" element={<Taxonomy />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
