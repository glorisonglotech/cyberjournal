import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { OwlMark } from "./Logo";

const SECTIONS = [
  { to: "/writeups", label: "Writeups" },
  { to: "/tutorials", label: "Tutorials" },
  { to: "/news", label: "Cyber News" },
  { to: "/about", label: "About" },
  { to: "/search", label: "Search" },
];

const ELSEWHERE = [
  { href: "https://glorison.netlify.app/", label: "Portfolio" },
  { href: "https://github.com/glorisonglotech", label: "GitHub" },
  { href: "https://linkedin.com/in/glorison", label: "LinkedIn" },
  { href: "https://x.com/glorison01", label: "X / Twitter" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-rule bg-paper-2">
      <div className="shell grid gap-12 py-14 md:grid-cols-12 md:gap-8 md:py-16">
        <div className="md:col-span-5 md:pr-10">
          <div className="flex items-center gap-4">
            <OwlMark size={40} />
            <span className="font-serif text-[22px] leading-[1.15] font-medium tracking-[-0.01em] text-bone">
              Glorison
              <br />
              Cyber Journal
            </span>
          </div>
          <p className="mt-6 max-w-[28ch] font-serif text-[19px] leading-snug text-bone-dim">
            Breaking things, understanding why, and documenting the process.
          </p>
          <p className="mt-6 text-[14px] text-dim">Independent security research · Kenya</p>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-[15px] font-semibold text-bone">Sections</h2>
          <ul className="mt-5 space-y-3">
            {SECTIONS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="link-underline text-[15px] text-bone-dim transition-colors hover:text-bone"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-[15px] font-semibold text-bone">Elsewhere</h2>
          <ul className="mt-5 space-y-3">
            {ELSEWHERE.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center gap-1.5 text-[15px] text-bone-dim transition-colors hover:text-bone"
                >
                  <span className="link-underline">{item.label}</span>
                  <ArrowUpRight
                    size={13}
                    className="text-ghost transition-colors group-hover:text-signal"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <h2 className="text-[15px] font-semibold text-bone">Colophon</h2>
          <p className="mono mt-5 text-[13px] leading-[1.9] text-dim">
            MERN · React 18
            <br />
            Express + MongoDB
            <br />
            Set in Inter Tight
            <br />
            &amp; JetBrains Mono
            <br />
            <span className="text-faint">Issue 01 · Vol. I</span>
          </p>
        </div>
      </div>

      <div className="border-t border-rule">
        <div className="shell flex flex-col justify-between gap-2 py-5 text-[14px] text-dim md:flex-row md:items-center">
          <p>© {year} Glorison Ouma · All research published for education</p>
          <p>
            Built &amp; maintained by{" "}
            <a
              href="https://glorison.netlify.app/"
              target="_blank"
              rel="noreferrer noopener"
              className="text-bone-dim underline decoration-ghost underline-offset-4 transition-colors hover:text-signal"
            >
              Glorison
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}