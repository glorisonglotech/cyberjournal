import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, FilePlus2, Tags } from "lucide-react";
import { adminApi, errorMessage } from "../../services/api";
import type { AdminStats, DashboardData } from "../../types";
import { usePageMeta } from "../../hooks/usePageMeta";
import { ErrorState, Spinner } from "../../components/ui";
import { articlePath, TYPE_LABELS, formatDateTime } from "../../lib/format";

const PANEL_HEAD = "border-b border-rule pb-3 text-[15px] font-semibold text-bone";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({ title: "Overview — Admin", description: "Publication overview." });

  useEffect(() => {
    let alive = true;
    Promise.all([adminApi.dashboard(), adminApi.stats()])
      .then(([dashboard, statistics]) => {
        if (!alive) return;
        setData(dashboard);
        setStats(statistics);
      })
      .catch((caught) => {
        if (alive) setError(errorMessage(caught));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <Spinner label="Loading overview" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const maxType = Math.max(1, ...data.byType.map((item) => item.count));
  const maxPlatform = Math.max(1, ...data.byPlatform.map((item) => item.count));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5 border-b border-rule pb-8">
        <div>
          <p className="text-[15px] font-medium text-signal">Editorial desk</p>
          <h1 className="display mt-3 font-serif text-[clamp(2.2rem,4.6vw,3.2rem)] leading-[1.05] font-medium tracking-[-0.025em] text-bone">
            Overview
          </h1>
          <p className="mt-3 text-[15px] text-dim">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/admin/articles/new" className="btn btn-primary">
            <FilePlus2 size={15} /> New article
          </Link>
          <Link to="/admin/taxonomy" className="btn btn-ghost">
            <Tags size={15} /> Taxonomy
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-x-0 gap-y-9 border-b border-rule pb-10 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total articles", value: data.counts.total, href: "/admin/articles" },
          { label: "Published", value: data.counts.published, href: "/admin/articles?status=published" },
          { label: "Drafts", value: data.counts.drafts, href: "/admin/articles?status=draft" },
          { label: "Featured", value: data.counts.featured, href: "/admin/articles" },
          { label: "Categories", value: data.counts.categories, href: "/admin/taxonomy" },
        ].map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="group lg:border-l lg:border-rule lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
          >
            <span className="text-[15px] text-dim">{item.label}</span>
            <p className="mt-2 font-serif text-[52px] leading-none font-medium tracking-[-0.03em] text-bone transition-colors group-hover:text-signal">
              {String(item.value).padStart(2, "0")}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-[14px] text-dim transition-colors group-hover:text-signal">
              Manage <ArrowUpRight size={14} />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="flex items-baseline justify-between border-b border-rule pb-3">
            <h2 className="text-[15px] font-semibold text-bone">Recent publications</h2>
            <Link
              to="/admin/articles"
              className="text-[14px] text-dim transition-colors hover:text-bone"
            >
              All articles →
            </Link>
          </div>

          <div className="divide-y divide-rule">
            {data.recent.map((item) => (
              <div key={item._id} className="flex items-center justify-between gap-5 py-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 text-[14px]">
                    <span
                      className={`font-semibold capitalize ${
                        item.status === "published" ? "text-ok" : "text-warn"
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-dim">{TYPE_LABELS[item.articleType]}</span>
                  </div>
                  <Link
                    to={`/admin/articles/${item._id}/edit`}
                    className="mt-1.5 block truncate text-[17px] text-bone transition-colors hover:text-signal"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-[14px] text-dim">
                    Updated {formatDateTime(item.updatedAt)} · {item.readingTime} min
                  </p>
                </div>
                <Link
                  to={`/admin/articles/${item._id}/edit`}
                  className="shrink-0 rounded-sm border border-rule px-3.5 py-2 text-[14px] text-bone-dim transition-colors hover:border-bone-dim hover:text-bone"
                >
                  Edit
                </Link>
              </div>
            ))}
            {data.recent.length === 0 && (
              <p className="py-8 text-[15px] text-dim">No articles yet. Start with a new entry.</p>
            )}
          </div>
        </section>

        <aside className="space-y-10 self-start rounded-md bg-paper-2 p-6 md:p-7">
          <section>
            <h2 className={PANEL_HEAD}>By type</h2>
            <ul className="mt-5 space-y-4">
              {data.byType.map((item) => (
                <li key={item._id}>
                  <div className="flex items-baseline justify-between text-[15px] text-bone-dim">
                    <span>{TYPE_LABELS[item._id] || item._id}</span>
                    <span className="mono text-[14px] text-dim">{item.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-rule">
                    <div
                      className="h-full rounded-full bg-signal"
                      style={{ width: `${(item.count / maxType) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
              {data.byType.length === 0 && <li className="text-[14px] text-dim">No data.</li>}
            </ul>
          </section>

          <section>
            <h2 className={PANEL_HEAD}>By platform</h2>
            <ul className="mt-5 space-y-4">
              {data.byPlatform.map((item) => (
                <li key={item._id}>
                  <div className="flex items-baseline justify-between text-[15px] text-bone-dim">
                    <span>{item._id}</span>
                    <span className="mono text-[14px] text-dim">{item.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-rule">
                    <div
                      className="h-full rounded-full bg-dim"
                      style={{ width: `${(item.count / maxPlatform) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
              {data.byPlatform.length === 0 && <li className="text-[14px] text-dim">No data.</li>}
            </ul>
          </section>

          {stats && (
            <section>
              <h2 className={PANEL_HEAD}>Activity</h2>
              <dl className="mt-5 space-y-3 text-[15px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-dim">Average reading time</dt>
                  <dd className="text-bone">{Math.round(stats.totals.avgReadingTime || 0)} min</dd>
                </div>
                {stats.latestPublished && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-dim">Latest publish</dt>
                    <dd className="min-w-0">
                      <Link
                        to={articlePath(stats.latestPublished)}
                        className="block truncate text-bone transition-colors hover:text-signal"
                      >
                        {stats.latestPublished.slug}
                      </Link>
                    </dd>
                  </div>
                )}
                {stats.topTags.length > 0 && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-dim">Top tag</dt>
                    <dd className="text-bone">#{stats.topTags[0]._id}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}