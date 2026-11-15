import type { TocEntry } from "../lib/markdown";

export function TableOfContents({
  entries,
  activeId,
}: {
  entries: TocEntry[];
  activeId: string;
}) {
  if (entries.length === 0) return null;

  return (
    <nav aria-label="On this page" className="border-t border-rule pt-4">
      <p className="eyebrow">On this page</p>
      <ol className="mt-3.5 space-y-px">
        {entries.map((entry) => {
          const active = activeId === entry.id;
          return (
            <li key={`${entry.id}-${entry.level}`}>
              <a
                href={`#${entry.id}`}
                aria-current={active ? "location" : undefined}
                className={`block border-l py-1.5 pr-2 text-[11.5px] leading-snug transition-colors ${
                  entry.level === 3 ? "pl-6" : "pl-3"
                } ${
                  active
                    ? "border-l-signal bg-paper-2 text-bone"
                    : "border-l-rule text-dim hover:border-l-dim hover:text-bone-dim"
                }`}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
