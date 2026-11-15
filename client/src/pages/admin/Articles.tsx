import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ExternalLink, FilePlus2, Pencil, Trash2 } from "lucide-react";
import { adminApi, errorMessage } from "../../services/api";
import type { ArticleListResponse } from "../../types";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useDebounced } from "../../hooks/useArticles";
import { ErrorState, Pagination, Spinner } from "../../components/ui";
import { articlePath, formatDateTime, TYPE_LABELS } from "../../lib/format";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

/* Size, case and font are set here so chips read the same under any stylesheet. */
const CHIP = "chip !gap-2 !px-3.5 !py-1.5 font-sans text-[14px] normal-case tracking-normal";

const ACTION =
  "inline-flex h-9 w-9 items-center justify-center rounded-sm text-dim transition-colors hover:bg-paper-2";

export default function AdminArticles() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "all";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [search, setSearch] = useState(params.get("q") || "");
  const debounced = useDebounced(search, 320);
  const [data, setData] = useState<ArticleListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  usePageMeta({ title: "Articles — Admin", description: "Manage journal articles." });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.articles({
        page,
        status,
        q: debounced.trim() || undefined,
        limit: 12,
      });
      setData(response);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [page, status, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    try {
      await adminApi.remove(id);
      setNotice("Article deleted.");
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-rule pb-8">
        <div>
          <p className="text-[15px] font-medium text-signal">Editorial desk</p>
          <h1 className="display mt-3 font-serif text-[clamp(2.2rem,4.6vw,3.2rem)] leading-[1.05] font-medium tracking-[-0.025em] text-bone">
            Articles
          </h1>
          <p className="mt-3 text-[15px] text-dim">
            {data ? `${data.pagination.total} entries` : "—"}
          </p>
        </div>
        <Link to="/admin/articles/new" className="btn btn-primary">
          <FilePlus2 size={15} /> New article
        </Link>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((item) => (
            <button
              key={item.value}
              type="button"
              className={CHIP}
              data-active={status === item.value}
              onClick={() => setParam("status", item.value === "all" ? "" : item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter by title, excerpt or tag…"
          aria-label="Filter articles"
          className="field !py-2.5 !text-[16px] md:max-w-sm"
        />
      </div>

      {notice && (
        <p className="mt-5 rounded-sm border border-l-[3px] border-rule border-l-ok bg-paper px-4 py-3 text-[15px] text-ok">
          {notice}
        </p>
      )}

      {loading && <Spinner label="Loading articles" />}
      {error && !loading && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && data && (
        <>
          <div className="mt-6 overflow-x-auto rounded-sm border border-rule">
            <table className="w-full min-w-[860px] border-collapse text-left">
              <thead>
                <tr className="border-b border-rule bg-paper-2">
                  {["Title", "Type", "Status", "Updated", "Actions"].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-[14px] font-semibold text-bone-dim last:text-right"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.articles.map((article) => (
                  <tr
                    key={article._id}
                    className="border-b border-rule-soft transition-colors last:border-b-0 hover:bg-paper"
                  >
                    <td className="px-5 py-4">
                      <Link
                        to={`/admin/articles/${article._id}/edit`}
                        className="text-[16px] text-bone transition-colors hover:text-signal"
                      >
                        {article.title}
                      </Link>
                      <p className="mono mt-1 text-[13px] text-faint">
                        /{article.slug} · {article.readingTime} min
                      </p>
                    </td>
                    <td className="px-5 py-4 text-[15px] text-dim">
                      {TYPE_LABELS[article.articleType]}
                    </td>
                    <td className="px-5 py-4 text-[15px]">
                      <span
                        className={`font-semibold capitalize ${
                          article.status === "published" ? "text-ok" : "text-warn"
                        }`}
                      >
                        {article.status}
                      </span>
                      {article.featured && (
                        <span className="ml-2 text-[14px] text-signal">· featured</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[15px] whitespace-nowrap text-dim">
                      {formatDateTime(article.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {article.status === "published" && (
                          <a
                            href={articlePath(article)}
                            target="_blank"
                            rel="noreferrer noopener"
                            className={`${ACTION} hover:text-bone`}
                            aria-label="View published article"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                        <Link
                          to={`/admin/articles/${article._id}/edit`}
                          className={`${ACTION} hover:text-bone`}
                          aria-label="Edit article"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(article._id, article.title)}
                          className={`${ACTION} hover:text-signal`}
                          aria-label="Delete article"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.articles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-[15px] text-dim">
                      No articles match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <Pagination
              page={data.pagination.page}
              pages={data.pagination.pages}
              onChange={(value) => setParam("page", String(value))}
            />
          </div>
        </>
      )}
    </div>
  );
}