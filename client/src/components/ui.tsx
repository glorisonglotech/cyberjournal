import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { difficultyTone, padIndex, TYPE_LABELS } from "../lib/format";
import type { ArticleSummary } from "../types";

export function SectionLabel({
  index,
  children,
  right,
}: {
  index?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3">
      <div className="flex items-baseline gap-3">
        {index && <span className="mono text-[10px] tracking-[0.06em] text-signal">{index}</span>}
        <span className="h-px w-6 translate-y-[-3px] bg-rule" aria-hidden="true" />
        <h2 className="mono text-[10px] font-medium tracking-[0.2em] text-bone uppercase">
          {children}
        </h2>
      </div>
      {right && (
        <div className="mono text-[9px] tracking-[0.12em] text-faint uppercase">{right}</div>
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  meta,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-rule pt-12 pb-10 md:pt-16 md:pb-12">
      <div className="flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
        <span className="eyebrow">{eyebrow}</span>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-12 md:items-end md:gap-10">
        <h1 className="display text-[clamp(2.5rem,5.6vw,4.15rem)] text-bone md:col-span-7 lg:col-span-8">
          {title}
        </h1>
        <div className="md:col-span-5 md:border-l md:border-rule md:pl-8 lg:col-span-4">
          {intro && <p className="text-[14px] leading-relaxed text-bone-dim">{intro}</p>}
          {meta && <div className="mt-4">{meta}</div>}
        </div>
      </div>
      {children}
    </header>
  );
}

export function TypeBadge({
  type,
  className = "",
}: {
  type: ArticleSummary["articleType"];
  className?: string;
}) {
  return (
    <span
      className={`mono text-[9px] tracking-[0.16em] text-dim uppercase ${className}`}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return null;
  return (
    <span
      className={`mono text-[9px] tracking-[0.13em] uppercase ${difficultyTone(difficulty)}`}
    >
      {difficulty}
    </span>
  );
}

export function SampleBadge({ label = "Sample" }: { label?: string }) {
  return (
    <span className="mono inline-flex items-center border border-warn/45 bg-warn/5 px-1.5 py-[2px] text-[8px] tracking-[0.14em] text-warn uppercase">
      {label}
    </span>
  );
}

export function MetaDivider() {
  return (
    <span aria-hidden="true" className="mono text-ghost">
      /
    </span>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-16 text-dim">
      <Loader2 size={14} className="animate-spin text-signal" />
      <span className="mono text-[9.5px] tracking-[0.18em] uppercase">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="my-10 border border-rule border-l-2 border-l-signal bg-paper px-5 py-6">
      <div className="flex items-center gap-2 text-signal">
        <AlertTriangle size={13} />
        <span className="mono text-[9.5px] tracking-[0.16em] uppercase">Request failed</span>
      </div>
      <p className="mt-3 text-sm text-bone-dim">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-ghost mt-4">
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="border border-rule border-dashed px-6 py-14">
      <span className="mono text-[11px] text-ghost">00</span>
      <p className="mono mt-2 text-[9.5px] tracking-[0.2em] text-faint uppercase">No results</p>
      <h3 className="mt-3 max-w-md text-[20px] leading-snug font-medium tracking-[-0.02em] text-bone">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-dim">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  const numbers = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pages || Math.abs(value - page) <= 1,
  );

  return (
    <nav
      className="flex items-center justify-between border-t border-rule pt-5"
      aria-label="Pagination"
    >
      <button
        type="button"
        className="mono inline-flex items-center gap-2 text-[9.5px] tracking-[0.16em] text-dim uppercase transition-colors hover:text-bone disabled:opacity-30 disabled:hover:text-dim"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        <ArrowLeft size={12} /> Prev
      </button>

      <div className="flex items-center gap-1">
        {numbers.map((value, index) => {
          const previous = numbers[index - 1];
          const gap = previous && value - previous > 1;
          const active = value === page;
          return (
            <span key={value} className="flex items-center gap-1">
              {gap && <span className="mono px-1 text-[10px] text-ghost">…</span>}
              <button
                type="button"
                onClick={() => onChange(value)}
                aria-current={active ? "page" : undefined}
                className={`mono min-w-7 border px-2 py-1 text-[10px] transition-colors ${
                  active
                    ? "border-signal bg-signal text-on-signal"
                    : "border-transparent text-dim hover:border-rule hover:text-bone"
                }`}
              >
                {padIndex(value)}
              </button>
            </span>
          );
        })}
      </div>

      <button
        type="button"
        className="mono inline-flex items-center gap-2 text-[9.5px] tracking-[0.16em] text-dim uppercase transition-colors hover:text-bone disabled:opacity-30 disabled:hover:text-dim"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
      >
        Next <ArrowRight size={12} />
      </button>
    </nav>
  );
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="mono inline-flex items-center gap-2 text-[9.5px] tracking-[0.16em] text-dim uppercase transition-colors hover:text-bone"
    >
      <ArrowLeft size={12} /> {label}
    </Link>
  );
}
