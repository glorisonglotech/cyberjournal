import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ArrowUpRight, LogOut } from "lucide-react";
import { OwlMark } from "../components/Logo";
import { ThemeToggle } from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/articles", label: "Articles" },
  { to: "/admin/articles/new", label: "New article", end: true },
  { to: "/admin/taxonomy", label: "Categories & tags" },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-rule">
        <div className="shell flex h-[64px] items-center justify-between gap-4">
          <Link to="/admin" className="flex items-center gap-3">
            <OwlMark size={26} />
            <span className="mono text-[10px] tracking-[0.18em] text-bone uppercase">
              Journal <span className="text-dim">/ Admin</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle compact />
            <Link
              to="/"
              className="mono hidden items-center gap-1 text-[9.5px] tracking-[0.16em] text-dim uppercase hover:text-bone sm:flex"
            >
              View site <ArrowUpRight size={11} />
            </Link>
            <span className="mono hidden text-[9.5px] tracking-[0.12em] text-faint uppercase md:block">
              {user?.username}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="mono flex items-center gap-1.5 border border-rule px-2.5 py-1.5 text-[9.5px] tracking-[0.14em] text-dim uppercase hover:border-dim hover:text-bone"
            >
              <LogOut size={11} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-rule-soft">
        <div className="shell flex gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `mono border-b-2 px-3 py-3 text-[9.5px] tracking-[0.16em] whitespace-nowrap uppercase transition-colors ${
                  isActive
                    ? "border-signal text-bone"
                    : "border-transparent text-dim hover:text-bone-dim"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <main className="shell py-10">
        <Outlet />
      </main>
    </div>
  );
}
