import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { articlesApi, assetUrl, errorMessage } from "../services/api";
import type { Article, ArticleSummary, Category, PublicStats } from "../types";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  articlePath,
  difficultyTone,
  formatDate,
  padIndex,
  TYPE_LABELS,
} from "../lib/format";
import { ErrorState, Spinner, SampleBadge } from "../components/ui";

const FOCUS = [
  "Web applications",
  "Linux",
  "API security",
  "Privilege escalation",
  "SOC & detection",
];

function categoryHref(category: Category) {
  if (category.slug === "tutorials") return "/tutorials";
  if (category.slug === "cybersecurity-news") return "/news";
  return `/writeups?category=${category.slug}`;
}

/* Section heading: same text as before (index, title, right-hand note). */
function SectionHead({
  index,
  right,
  rule = true,
  children,
}: {
  index: string;
  right?: ReactNode;
  rule?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-6 ${
        rule ? "border-b border-rule pb-3" : ""
      }`}
    >
      <h2 className="flex items-baseline gap-3 text-[15px] font-semibold text-bone">
        <span className="mono text-[13px] font-normal text-dim">{index}</span>
        {children}
      </h2>
      {right && <span className="text-[14px] text-dim">{right}</span>}
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState<Article | null>(null);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [summary, setSummary] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: "Glorison Cyber Journal",
    description:
      "Breaking things, understanding why, and documenting the process. CTF writeups, security tutorials and vulnerability analysis by Glorison Ouma.",
  });

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [featuredArticle, latest, categoryList, archiveStats] = await Promise.all([
          articlesApi.featured(),
          articlesApi.list({ limit: 12 }),
          articlesApi.categories(),
          articlesApi.stats(),
        ]);
        if (!alive) return;
        setFeatured(featuredArticle);
        setArticles(latest.articles);
        setTotal(latest.pagination.total);
        setCategories(categoryList);
        setSummary(archiveStats);
      } catch (caught) {
        if (alive) setError(errorMessage(caught));
      } finally {
        if (alive) setLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    const writeups = articles.filter((item) => item.articleType === "ctf-writeup").length;
    const tutorials = articles.filter((item) => item.articleType === "tutorial").length;
    const platforms = new Set(articles.map((item) => item.platform).filter(Boolean));
    const newest = [...articles].sort(
      (a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime(),
    )[0];
    return { writeups, tutorials, platforms: platforms.size, newest };
  }, [articles]);

  const latest = articles.filter((item) => item._id !== featured?._id).slice(0, 5);
  const [lead, ...rest] = latest;

  const totals = summary?.totals ?? {
    published: total,
    writeups: stats.writeups,
    tutorials: stats.tutorials,
    platforms: stats.platforms,
  };

  if (loading) {
    return (
      <div className="shell">
        <Spinner label="Loading the journal" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="shell">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <>
      {/* ── Masthead + hero ────────────────────────────────────────────── */}
      <section className="border-b border-rule">
        <div className="shell">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-3 text-[14px] text-dim">
            <span>Issue 01 · Vol. I</span>
            <span className="hidden sm:block">Security research / field notes</span>
            <span>
              {stats.newest
                ? `Last entry — ${formatDate(stats.newest.publishedAt, "short")}`
                : "Inaugural issue"}
            </span>
          </div>

          <div className="grid gap-12 pt-14 pb-14 lg:grid-cols-12 lg:gap-0 lg:pt-20 lg:pb-20">
            <div className="lg:col-span-8 lg:pr-14">
              <p className="text-[16px] font-medium text-signal">Glorison Cyber Journal</p>

              <h1 className="display mt-5 font-serif text-[clamp(2.6rem,6.2vw,5.5rem)] leading-[1.02] font-medium tracking-[-0.025em] text-bone">
                Breaking things,
                <br />
                understanding <span className="text-signal italic">why</span>,
                <br />
                documenting the process.
              </h1>

              <p className="mt-10 max-w-xl text-[18px] leading-relaxed text-bone-dim">
                A personal publication of CTF writeups, hands-on tutorials and vulnerability
                analysis — written the way technical notes should be: reproducible, honest about
                what failed, and specific about the fix.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link to="/writeups" className="btn btn-primary">
                  Explore writeups <ArrowRight size={15} />
                </Link>
                <Link
                  to="/tutorials"
                  className="group inline-flex items-center gap-1.5 text-[16px] text-bone underline decoration-ghost underline-offset-[6px] transition-colors hover:decoration-signal"
                >
                  Browse tutorials
                  <ArrowUpRight
                    size={14}
                    className="text-dim transition-colors group-hover:text-signal"
                  />
                </Link>
              </div>
            </div>

            <aside className="self-start rounded-md bg-paper-2 p-6 md:p-7 lg:col-span-4">
              <div className="flex items-baseline justify-between">
                <span className="mono text-[13px] text-bone">journal.status</span>
                <span className="flex items-center gap-1.5 text-[13px] text-ok">
                  <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden="true" /> live
                </span>
              </div>

              <dl className="mt-5">
                {[
                  ["Entries", padIndex(totals.published)],
                  ["Writeups", padIndex(totals.writeups)],
                  ["Tutorials", padIndex(totals.tutorials)],
                  ["Platforms", padIndex(totals.platforms)],
                  ["Sections", padIndex(categories.length)],
                ].map(([label, value]) => (
                  <div className="flex items-baseline gap-3 py-1.5" key={label}>
                    <dt className="text-[16px] text-bone-dim">{label}</dt>
                    <span className="leader" aria-hidden="true" />
                    <dd className="mono text-[15px] text-bone">{value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mono mt-6 border-t border-rule pt-5 text-[13px] leading-relaxed text-dim">
                ~/journal <span className="text-ghost">—</span>{" "}
                <span className="text-bone-dim">flag&#123;read_the_error_message&#125;</span>
              </p>

              <p className="mt-4 text-[14px] leading-relaxed text-dim">
                All testing performed in authorised labs or against retired targets.
              </p>
            </aside>
          </div>

          <ul className="flex flex-wrap gap-x-10 gap-y-3 border-t border-rule py-6">
            {FOCUS.map((item, index) => (
              <li key={item} className="flex items-baseline gap-2.5 text-[16px] text-bone-dim">
                <span className="mono text-[12px] text-dim">{padIndex(index + 1)}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Front page: featured + latest side by side ─────────────────── */}
      <section className="shell py-14 md:py-20">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-0">
          {featured && (
            <div className="lg:col-span-7 lg:border-r lg:border-rule lg:pr-12">
              <SectionHead index="01" right="Selected by the author">
                Featured publication
              </SectionHead>

              <Link
                to={articlePath(featured)}
                className="group mt-8 block overflow-hidden rounded-sm border border-rule bg-paper"
                aria-label={featured.title}
              >
                {featured.coverImage ? (
                  <img
                    src={assetUrl(featured.coverImage)}
                    alt=""
                    loading="eager"
                    className="aspect-[16/10] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[16/10] w-full bg-paper-2" />
                )}
              </Link>
              <div className="mt-3 flex items-center justify-between text-[14px] text-dim">
                <span>Fig. 01 — {featured.category?.name}</span>
                <span>{featured.operatingSystem || "Security"}</span>
              </div>

              <div className="mt-9">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]">
                  <span className="font-semibold text-signal">
                    {featured.platform || TYPE_LABELS[featured.articleType]}
                  </span>
                  <span className="text-ghost" aria-hidden="true">
                    /
                  </span>
                  <span className="text-dim">{featured.category?.name}</span>
                  {featured.isSample && <SampleBadge />}
                </div>

                <h2 className="balance display mt-4 font-serif text-[clamp(1.9rem,3.2vw,2.8rem)] leading-[1.08] font-medium tracking-[-0.02em] text-bone">
                  <Link
                    to={articlePath(featured)}
                    className="transition-colors hover:text-signal"
                  >
                    {featured.title}
                  </Link>
                </h2>

                <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-bone-dim">
                  {featured.excerpt}
                </p>

                <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-5 border-t border-rule pt-6 sm:grid-cols-4">
                  <div>
                    <dt className="text-[14px] text-dim">Platform</dt>
                    <dd className="mt-0.5 text-[16px] text-bone">{featured.platform || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[14px] text-dim">Difficulty</dt>
                    <dd className={`mt-0.5 text-[16px] ${difficultyTone(featured.difficulty)}`}>
                      {featured.difficulty || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[14px] text-dim">Published</dt>
                    <dd className="mt-0.5 text-[16px] text-bone">
                      {formatDate(featured.publishedAt, "short")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[14px] text-dim">Reading</dt>
                    <dd className="mt-0.5 text-[16px] text-bone">{featured.readingTime} min</dd>
                  </div>
                </dl>

                <Link
                  to={articlePath(featured)}
                  className="group mt-9 inline-flex items-center gap-2 text-[16px] font-medium text-bone underline decoration-signal underline-offset-[6px] transition-colors hover:text-signal"
                >
                  Read the publication
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            </div>
          )}

          <div className={featured ? "lg:col-span-5 lg:pl-12" : "lg:col-span-12"}>
            <SectionHead
              index="02"
              right={
                <Link to="/writeups" className="transition-colors hover:text-bone">
                  Full archive →
                </Link>
              }
            >
              Latest publications
            </SectionHead>

            {lead && (
              <article className="mt-8">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]">
                  <span className="font-semibold text-signal">Most recent</span>
                  <span className="text-dim">{TYPE_LABELS[lead.articleType]}</span>
                  {lead.isSample && <SampleBadge />}
                </div>

                <h3 className="balance mt-4 font-serif text-[clamp(1.6rem,2.4vw,2.1rem)] leading-[1.12] font-medium tracking-[-0.02em] text-bone">
                  <Link
                    to={articlePath(lead)}
                    className="transition-colors hover:text-signal"
                  >
                    {lead.title}
                  </Link>
                </h3>

                <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-bone-dim">
                  {lead.excerpt}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] text-dim">
                  {[
                    lead.platform || lead.category?.name,
                    formatDate(lead.publishedAt, "short"),
                    `${lead.readingTime} min`,
                  ]
                    .filter(Boolean)
                    .map((item) => (
                      <span key={String(item)}>{item}</span>
                    ))}
                </div>

                {lead.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
                    {lead.tags.slice(0, 5).map((tag) => (
                      <span key={tag} className="mono text-[13px] text-dim">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )}

            {rest.length > 0 && (
              <div className="mt-9 border-t border-rule">
                {rest.map((article, index) => (
                  <article key={article._id} className="border-b border-rule">
                    <Link
                      to={articlePath(article)}
                      className="group grid grid-cols-[2rem_1fr] gap-4 py-5"
                    >
                      <span className="mono pt-1.5 text-[13px] text-dim">
                        {padIndex(index + 2)}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-dim">
                          <span className="font-semibold text-bone-dim">
                            {article.platform || TYPE_LABELS[article.articleType]}
                          </span>
                          <span>{formatDate(article.publishedAt, "short")}</span>
                          {article.isSample && <SampleBadge />}
                        </div>
                        <h3 className="balance mt-1.5 font-serif text-[20px] leading-snug font-medium tracking-[-0.01em] text-bone transition-colors group-hover:text-signal">
                          {article.title}
                        </h3>
                        <span className="mt-2 inline-flex items-center gap-1 text-[14px] text-dim transition-colors group-hover:text-bone-dim">
                          {article.readingTime} min
                          <ChevronRight
                            size={14}
                            className="transition-transform group-hover:translate-x-0.5 group-hover:text-signal"
                          />
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Categories: heading on the left, index on the right ────────── */}
      <section className="border-t border-rule">
        <div className="shell grid gap-8 py-14 md:py-20 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <SectionHead index="03" right={`${categories.length} sections`} rule={false}>
              Explore categories
            </SectionHead>
          </div>

          <ul className="lg:col-span-8">
            {categories.map((category, index) => (
              <li key={category._id} className="border-b border-rule">
                <Link
                  to={categoryHref(category)}
                  className={`group grid grid-cols-[2rem_1fr_auto] items-baseline gap-4 py-6 sm:gap-6 ${
                    index === 0 ? "lg:pt-0" : ""
                  }`}
                >
                  <span className="mono text-[13px] text-dim">{padIndex(index + 1)}</span>

                  <div className="min-w-0">
                    <h3 className="font-serif text-[clamp(1.45rem,2.4vw,2rem)] leading-tight font-medium tracking-[-0.015em] text-bone transition-colors group-hover:text-signal">
                      {category.name}
                    </h3>
                    <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-dim">
                      {category.description}
                    </p>
                  </div>

                  <span className="flex items-center gap-3 text-[15px] text-dim">
                    {String(category.articleCount ?? 0).padStart(2, "0")}
                    <ArrowUpRight
                      size={16}
                      className="text-ghost transition-colors group-hover:text-signal"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <section className="border-t border-rule bg-paper-2">
        <div className="shell py-14 md:py-20">
          <SectionHead index="04" rule={false}>
            About the journal
          </SectionHead>

          <div className="mt-10 grid gap-8 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-5">
              <h2 className="display font-serif text-[clamp(1.9rem,3.4vw,2.7rem)] leading-[1.08] font-medium tracking-[-0.02em] text-bone">
                A working notebook,
                <br />
                kept in public.
              </h2>
            </div>

            <div className="md:col-span-6 md:col-start-7">
              <p className="text-[17px] leading-relaxed text-bone-dim">
                Glorison Cyber Journal is where I document security work as it happens: lab
                machines broken and rebuilt, vulnerabilities traced to their root cause, and the
                fixes written in code. It sits alongside my{" "}
                <a
                  href="https://glorison.netlify.app/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-bone underline decoration-signal underline-offset-4 transition-colors hover:text-signal"
                >
                  main portfolio
                </a>
                , which covers the professional side of the same work.
              </p>
              <p className="mt-4 text-[17px] leading-relaxed text-bone-dim">
                The rule for everything published here is simple: if a reader cannot reproduce it
                from the notes, the notes are not finished.
              </p>

              <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-t border-rule pt-6 text-[15px] text-bone-dim">
                <Link to="/about" className="transition-colors hover:text-bone">
                  Read more about the journal →
                </Link>
                <Link to="/search" className="transition-colors hover:text-bone">
                  Search the archive →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}