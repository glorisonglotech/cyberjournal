import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { padIndex } from "../lib/format";

const LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/writeups", label: "Writeups", end: false },
  { to: "/tutorials", label: "Tutorials", end: false },
  { to: "/news", label: "Cyber News", end: false },
  { to: "/about", label: "About", end: false },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-ink">
      <div className="shell flex h-[68px] items-center justify-between gap-6">
        <Link to="/" aria-label="Glorison Cyber Journal — home" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `nav-link text-[15px] font-medium transition-colors ${
                  isActive ? "text-bone" : "text-bone-dim hover:text-bone"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NavLink
            to="/search"
            aria-label="Search the journal"
            className={({ isActive }) =>
              `flex h-9 w-9 items-center justify-center rounded-sm border transition-colors ${
                isActive
                  ? "border-signal text-signal"
                  : "border-rule text-bone-dim hover:border-bone-dim hover:text-bone"
              }`
            }
          >
            <Search size={16} strokeWidth={1.8} />
          </NavLink>

          <span className="hidden h-6 w-px bg-rule sm:block" aria-hidden="true" />

          <span className="hidden sm:block">
            <ThemeToggle />
          </span>
          <span className="sm:hidden">
            <ThemeToggle compact />
          </span>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-sm text-bone-dim transition-colors hover:text-bone md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-rule md:hidden">
          <nav className="shell py-2" aria-label="Mobile">
            {[...LINKS, { to: "/search", label: "Search", end: false }].map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `grid grid-cols-[2rem_1fr_auto] items-baseline gap-3 border-b border-rule-soft py-4 transition-colors ${
                    isActive ? "text-bone" : "text-bone-dim hover:text-bone"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="mono text-[13px] text-dim">{padIndex(index + 1)}</span>
                    <span className="font-serif text-[22px] leading-tight font-medium tracking-[-0.01em]">
                      {link.label}
                    </span>
                    <span
                      className={`text-[14px] ${isActive ? "text-signal" : "text-ghost"}`}
                      aria-hidden="true"
                    >
                      {isActive ? "●" : "↗"}
                    </span>
                  </>
                )}
              </NavLink>
            ))}

            <div className="flex items-center justify-between py-4">
              <span className="text-[15px] text-dim">Appearance</span>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}