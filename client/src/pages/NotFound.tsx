import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { usePageMeta } from "../hooks/usePageMeta";

export default function NotFound() {
  usePageMeta({
    title: "404 — Not found",
    description: "That page is not in the journal.",
  });

  return (
    <div className="shell py-24">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
          <span className="eyebrow">404 / not found</span>
        </div>

        <h1 className="display mt-6 text-[clamp(2.5rem,6.5vw,4.3rem)] text-bone">
          Nothing filed
          <br />
          under that path.
        </h1>

        <p className="mt-6 max-w-md text-[14.5px] leading-relaxed text-bone-dim">
          The page you asked for does not exist, was renamed, or is still a draft. The archive is
          the best place to pick the trail back up.
        </p>

        <div className="term-panel mt-9 max-w-md">
          <div className="term-row">
            <span className="text-[9px] tracking-[0.13em] text-faint uppercase">Request</span>
            <span className="truncate text-bone-dim">{window.location.pathname}</span>
          </div>
          <div className="term-row">
            <span className="text-[9px] tracking-[0.13em] text-faint uppercase">Status</span>
            <span className="text-signal">404</span>
          </div>
          <div className="term-row">
            <span className="text-[9px] tracking-[0.13em] text-faint uppercase">Next</span>
            <span className="text-bone-dim">/writeups</span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/writeups" className="btn btn-primary">
            Open the archive
          </Link>
          <Link to="/" className="btn btn-ghost">
            <ArrowLeft size={11} /> Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
