import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useArticles } from "../hooks/useArticles";
import { usePageMeta } from "../hooks/usePageMeta";
import { FilterRow } from "../components/ArchiveFilters";
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner, SampleBadge } from "../components/ui";
import { articlePath, difficultyTone, padIndex } from "../lib/format";

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const LIMIT = 8;

export default function Tutorials() {
  const [params, setParams] = useSearchParams();
  const difficulty = params.get("difficulty") || "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const { data, loading, error, refetch } = useArticles({
    articleType: "tutorial",
    difficulty,
    page,
    limit: LIMIT,
    sort: "reading",
  });

  usePageMeta({
    title: "Tutorials",
    description:
      "A technical learning library: SQL injection, API security, Linux privilege escalation, reconnaissance and security tooling.",
  });

  const update = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set("difficulty", value);
    else next.delete("difficulty");
    next.delete("page");
    setParams(next);
  };

  const setPage = (value: number) => {
    const next = new URLSearchParams(params);
    if (value <= 1) next.delete("page");
    else next.set("page", String(value));
    setParams(next);
  };

  return (
    <div className="shell">
      <PageHeader
        eyebrow="Library / learning"
        title="Tutorials"
        intro="Long-form teaching written for the person one step behind me: start from the concept, prove it in a lab, then fix it properly in code."
        meta={
          <p className="mono text-[8.5px] leading-relaxed tracking-[0.11em] text-faint uppercase">
            Topics — Linux · Networking · Web security · APIs · Authentication · Recon · SOC
          </p>
        }
      />

      <div className="mt-2 border-b border-rule">
        <FilterRow
          label="Level"
          value={difficulty}
          onChange={update}
          options={DIFFICULTIES.map((item) => ({ value: item, label: item }))}
        />
      </div>

      {loading && <Spinner label="Opening the library" />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && data && (
        <>
          {data.articles.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="No tutorials at that level yet"
                description="Try another difficulty, or browse the archive for a writeup that covers the same technique in practice."
              >
                <Link to="/writeups" className="btn btn-ghost">
                  Open the archive
                </Link>
              </EmptyState>
            </div>
          ) : (
            <div className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2">
              {data.articles.map((article, index) => (
                <Link
                  key={article._id}
                  to={articlePath(article)}
                  className="group flex flex-col justify-between bg-paper p-6 transition-colors hover:bg-paper-2 sm:p-7"
                >
                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="mono text-[9.5px] text-ghost">
                        {padIndex((page - 1) * LIMIT + index + 1)}
                      </span>
                      <span
                        className={`mono text-[8.5px] tracking-[0.15em] uppercase ${difficultyTone(article.difficulty)}`}
                      >
                        {article.difficulty || "General"}
                      </span>
                    </div>

                    <h2 className="balance mt-5 text-[19px] leading-snug font-medium tracking-[-0.025em] text-bone transition-colors group-hover:text-signal">
                      {article.title}
                    </h2>

                    <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-dim">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="mono text-[8.5px] text-faint">
                          #{tag}
                        </span>
                      ))}
                      {article.isSample && <SampleBadge />}
                    </div>

                    <div className="mono mt-4 flex items-center justify-between border-t border-rule-soft pt-3 text-[8.5px] tracking-[0.11em] text-faint uppercase">
                      <span>
                        {article.readingTime} min · {article.category?.name}
                      </span>
                      <ArrowUpRight
                        size={12}
                        className="text-ghost transition-colors group-hover:text-signal"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
