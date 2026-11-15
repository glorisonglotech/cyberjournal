import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { useArticles } from "../hooks/useArticles";
import { usePageMeta } from "../hooks/usePageMeta";
import { EmptyState, ErrorState, PageHeader, Pagination, SampleBadge, Spinner } from "../components/ui";
import { articlePath, formatDate, TYPE_LABELS } from "../lib/format";

const LIMIT = 8;

export default function News() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);

  const { data, loading, error, refetch } = useArticles({
    category: "cybersecurity-news",
    page,
    limit: LIMIT,
  });

  usePageMeta({
    title: "Cyber News",
    description:
      "Vulnerability analysis, advisories and industry developments — with technical commentary and links to primary sources.",
  });

  const setPage = (value: number) => {
    const next = new URLSearchParams(params);
    if (value <= 1) next.delete("page");
    else next.set("page", String(value));
    setParams(next);
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  return (
    <div className="shell">
      <PageHeader
        eyebrow="Desk / analysis"
        title="Cyber News"
        intro="Advisories, vulnerability analysis and industry developments. Every externally sourced item links to its primary source; samples are labelled as samples."
        meta={
          <p className="mono text-[8.5px] leading-relaxed tracking-[0.11em] text-faint uppercase">
            Policy — No fabricated incidents. No invented CVEs. Analysis separated from reporting.
          </p>
        }
      />

      <div className="border-b border-rule py-5">
        <div className="grid gap-3 sm:grid-cols-[104px_1fr] sm:gap-5">
          <span className="eyebrow pt-0.5">Editorial note</span>
          <p className="max-w-3xl text-[13px] leading-relaxed text-dim">
            This desk carries two kinds of entry. <span className="text-bone-dim">Analysis</span>{" "}
            is original technical commentary on a documented event, with a link to the primary
            advisory. <span className="text-bone-dim">Sample</span> marks placeholder content that
            demonstrates the format — it is never a claim about a real incident. Real advisories are
            added through the admin desk with their source attached.
          </p>
        </div>
      </div>

      {loading && <Spinner label="Loading the desk" />}
      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && data && (
        <>
          {data.articles.length === 0 ? (
            <div className="py-10">
              <EmptyState
                title="The desk is quiet"
                description="No news or analysis entries have been published yet."
              />
            </div>
          ) : (
            <div className="border-b border-rule">
              {data.articles.map((article) => {
                const sourced = Boolean(article.source?.url);
                return (
                  <article key={article._id} className="group relative border-t border-rule first:border-t-0">
                    <div className="grid gap-3 py-7 md:grid-cols-[120px_1fr] md:gap-8">
                      <div className="mono flex flex-row gap-3 text-[8.5px] tracking-[0.1em] text-faint uppercase md:flex-col md:gap-1.5">
                        <time dateTime={article.publishedAt}>
                          {formatDate(article.publishedAt, "short")}
                        </time>
                        <span className="text-ghost">{TYPE_LABELS[article.articleType]}</span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="mono border border-rule px-1.5 py-[2px] text-[8px] tracking-[0.13em] text-dim uppercase">
                            {sourced ? "Sourced analysis" : "Original"}
                          </span>
                          {article.isSample && <SampleBadge label="Sample content" />}
                          {article.category?.name && (
                            <span className="mono text-[8.5px] tracking-[0.13em] text-faint uppercase">
                              / {article.category.name}
                            </span>
                          )}
                        </div>

                        <h2 className="balance mt-3 text-[20px] leading-snug font-medium tracking-[-0.025em] text-bone md:text-[22px]">
                          <Link
                            to={articlePath(article)}
                            className="transition-colors hover:text-signal"
                          >
                            {article.title}
                          </Link>
                        </h2>

                        <p className="mt-2.5 max-w-3xl text-[13.5px] leading-relaxed text-dim">
                          {article.excerpt}
                        </p>

                        <div className="mono mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[8.5px] tracking-[0.1em] text-faint uppercase">
                          <span>{article.readingTime} min read</span>
                          {article.source?.url && (
                            <a
                              href={article.source.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1.5 text-bone-dim transition-colors hover:text-signal"
                            >
                              <ExternalLink size={9} />
                              {article.source.name || "Primary source"}
                            </a>
                          )}
                          <Link
                            to={articlePath(article)}
                            className="inline-flex items-center gap-1 transition-colors hover:text-bone"
                          >
                            Read analysis <ArrowUpRight size={10} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
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
