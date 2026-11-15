import type { ReactNode } from "react";
import { X } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

/* Chip look is set here (size, case, font) so it reads the same whichever
   global stylesheet is loaded; colour and active state still come from `.chip`. */
const CHIP = "chip !gap-2 !px-3 !py-1.5 font-sans text-[14px] normal-case tracking-normal";

export function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="grid gap-3 border-b border-rule-soft py-5 last:border-b-0 md:grid-cols-[120px_1fr] md:items-baseline md:gap-6">
      <span className="text-[14px] font-semibold text-bone-dim">{label}</span>
      <div className="flex flex-wrap gap-2" role="group" aria-label={`Filter by ${label}`}>
        <button
          type="button"
          className={CHIP}
          data-active={!value}
          onClick={() => onChange("")}
          aria-pressed={!value}
        >
          All
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={CHIP}
            data-active={value === option.value}
            onClick={() => onChange(value === option.value ? "" : option.value)}
            aria-pressed={value === option.value}
          >
            {option.label}
            {typeof option.count === "number" && option.count > 0 && (
              <span className="text-[12px] text-faint">{option.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ResultSummary({
  shown,
  total,
  page,
  limit,
  activeFilters,
  onClear,
}: {
  shown: number;
  total: number;
  page: number;
  limit: number;
  activeFilters: Array<{ key: string; label: string }>;
  onClear: () => void;
}): ReactNode {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = (page - 1) * limit + shown;

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 py-5">
      <p className="text-[15px] text-dim">
        Showing {String(from).padStart(2, "0")}–{String(to).padStart(2, "0")} of{" "}
        {String(total).padStart(2, "0")}
        {activeFilters.length > 0 && (
          <span className="text-faint">
            {" "}
            · filtered by {activeFilters.map((filter) => filter.label.toLowerCase()).join(", ")}
          </span>
        )}
      </p>

      {activeFilters.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 text-[14px] text-bone-dim underline decoration-ghost underline-offset-4 transition-colors hover:text-signal hover:decoration-signal"
        >
          <X size={14} /> Clear filters
        </button>
      )}
    </div>
  );
}