import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { articlesApi, assetUrl, errorMessage } from "../services/api";
import type { ArticleDetailResponse } from "../types";
import { useCanonical, usePageMeta } from "../hooks/usePageMeta";
import { useActiveHeading, useReadingProgress } from "../hooks/useReadingPosition";
import { extractToc } from "../lib/markdown";
import {
  articlePath,
  difficultyTone,
  formatDate,
  platformSlug,
  TYPE_LABELS,
  TYPE_PATHS,
} from "../lib/format";
import { MarkdownContent } from "../components/MarkdownContent";
import { TableOfContents } from "../components/TableOfContents";
import { ErrorState, SampleBadge, Spinner } from "../components/ui";

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<ArticleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!slug) return undefined;

    setLoading(true);
    setError(null);
    articlesApi
      .bySlug(slug)
      .then((response) => {
        if (alive) setData(response);
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
  }, [slug]);

  const article = data?.article;
  const toc = useMemo(() => (article ? extractToc(article.content) : []), [article]);
  const activeId = useActiveHeading(toc.map((entry) => entry.id));
  const progress = useReadingProgress("article-body");

  usePageMeta({
    title: article?.seoTitle || article?.title || "Article",
    description: article?.seoDescription || article?.excerpt,
    image: article?.coverImage,
    type: "article",
    publishedAt: article?.publishedAt,
    author: article?.author?.username,
  });

  useCanonical(article ? articlePath(article) : "/");

  useEffect(() => {
    if (!article) return undefined;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "article-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: article.title,
      description: article.excerpt,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: { "@type": "Person", name: "Glorison Ouma" },
      publisher: { "@type": "Organization", name: "Glorison Cyber Journal" },
      image: article.coverImage ? new URL(article.coverImage, window.location.origin).href : undefined,
      keywords: article.tags.join(", "),
      articleSection: article.category?.name,
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [article]);

  if (loading) {
    return (
      <div className="shell">
        <Spinner label="Opening the report" />
      </div>
    );
  }

  if (error || !article || !data) {
    return (
      <div className="shell py-16">
        <ErrorState message={error || "That article could not be found."} />
        <div className="mt-6">
          <Link
            to="/writeups"
            className="mono inline-flex items-center gap-2 text-[9.5px] tracking-[0.16em] text-dim uppercase transition-colors hover:text-bone"
          >
            <ArrowLeft size={11} /> Back to the archive
          </Link>
        </div>
      </div>
    );
  }

  const sectionLabel =
    article.articleType === "ctf-writeup"
      ? `writeups / ${platformSlug(article.platform)}`
      : TYPE_PATHS[article.articleType];

  return (
    <>
      <div className="progress-rail" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <article>
        {/* Breadcrumb */}
        <div className="border-b border-rule">
          <div className="shell mono flex flex-wrap items-center gap-x-2.5 gap-y-1 py-2.5 text-[8.5px] tracking-[0.15em] text-faint uppercase">
            <Link to="/" className="transition-colors hover:text-bone">
              Journal
            </Link>
            <span className="text-ghost" aria-hidden="true">
              /
            </span>
            <Link
              to={`/${TYPE_PATHS[article.articleType]}`}
              className="transition-colors hover:text-bone"
            >
              {sectionLabel}
            </Link>
            <span className="text-ghost" aria-hidden="true">
              /
            </span>
            <span className="text-dim">{article.slug}</span>
          </div>
        </div>

        {/* Header */}
        <header className="shell pt-10 pb-8 md:pt-14">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="mono text-[9px] tracking-[0.17em] text-signal uppercase">
              {article.platform || TYPE_LABELS[article.articleType]}
            </span>
            <span className="mono text-[9px] text-ghost" aria-hidden="true">
              /
            </span>
            <span className="mono text-[9px] tracking-[0.13em] text-dim uppercase">
              {TYPE_LABELS[article.articleType]}
            </span>
            {article.difficulty && (
              <>
                <span className="mono text-[9px] text-ghost" aria-hidden="true">
                  /
                </span>
                <span
                  className={`mono text-[9px] tracking-[0.13em] uppercase ${difficultyTone(article.difficulty)}`}
                >
                  {article.difficulty}
                </span>
              </>
            )}
            {article.isSample && <SampleBadge label="Demonstration" />}
          </div>

          <h1 className="balance mt-5 max-w-4xl text-[clamp(1.95rem,4.2vw,3rem)] leading-[1.06] font-semibold tracking-[-0.035em] text-bone">
            {article.title}
          </h1>

          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-bone-dim">
            {article.excerpt}
          </p>

          <dl className="mono mt-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-rule pt-5 text-[9px] sm:grid-cols-4">
            <div>
              <dt className="tracking-[0.15em] text-faint uppercase">Published</dt>
              <dd className="mt-1.5 text-[10px] text-bone-dim">{formatDate(article.publishedAt)}</dd>
            </div>
            <div>
              <dt className="tracking-[0.15em] text-faint uppercase">Reading time</dt>
              <dd className="mt-1.5 text-[10px] text-bone-dim">{article.readingTime} minutes</dd>
            </div>
            <div>
              <dt className="tracking-[0.15em] text-faint uppercase">Section</dt>
              <dd className="mt-1.5 text-[10px] text-bone-dim">{article.category?.name}</dd>
            </div>
            <div>
              <dt className="tracking-[0.15em] text-faint uppercase">Author</dt>
              <dd className="mt-1.5 text-[10px] text-bone-dim">
                {article.author?.username || "Glorison"}
              </dd>
            </div>
          </dl>
        </header>

        {article.coverImage && (
          <div className="shell">
            <img
              src={assetUrl(article.coverImage)}
              alt=""
              className="aspect-[16/8] w-full border border-rule object-cover"
            />
            <p className="mono mt-2.5 flex flex-wrap items-center justify-between gap-x-4 border-t border-rule-soft pt-2 text-[8.5px] tracking-[0.13em] text-faint uppercase">
              <span>
                Fig. 01 — {article.category?.name} ·{" "}
                {article.operatingSystem || "Security research"}
              </span>
              <span className="text-ghost">Glorison Cyber Journal</span>
            </p>
          </div>
        )}

        {/* Body */}
        <div className="shell mt-10 grid gap-12 pb-16 lg:grid-cols-[minmax(0,1fr)_236px] lg:gap-14">
          <div id="article-body" className="min-w-0">
            {article.isSample && (
              <p className="mb-8 border border-rule border-l-2 border-l-warn bg-paper px-4 py-3 text-[12.5px] leading-relaxed text-bone-dim">
                <span className="mono mr-2 text-[8.5px] tracking-[0.15em] text-warn uppercase">
                  Demonstration
                </span>
                This entry is sample content published with the journal to show the format. Flag
                values are redacted and steps are condensed.
              </p>
            )}

            <MarkdownContent content={article.content} />

            {article.source?.url && (
              <p className="mt-10 border-t border-rule pt-5 text-[12.5px] text-dim">
                Primary source:{" "}
                <a
                  href={article.source.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 text-bone-dim underline decoration-rule underline-offset-4 transition-colors hover:text-signal"
                >
                  {article.source.name || article.source.url}
                  <ExternalLink size={10} />
                </a>
              </p>
            )}

            {article.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-rule pt-5">
                <span className="eyebrow mr-1">Tags</span>
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/writeups?tag=${encodeURIComponent(tag)}`}
                    className="chip"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start lg:border-l lg:border-rule lg:pl-6">
            <div className="hidden lg:block">
              <TableOfContents entries={toc} activeId={activeId} />
            </div>

            {article.skills.length > 0 && (
              <div className="mt-7 border-t border-rule pt-4">
                <p className="eyebrow">Skills covered</p>
                <ul className="mt-3 space-y-1.5">
                  {article.skills.map((skill) => (
                    <li key={skill} className="text-[11.5px] leading-snug text-bone-dim">
                      <span className="mr-1.5 text-signal" aria-hidden="true">
                        ·
                      </span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {article.toolsUsed.length > 0 && (
              <div className="mt-7 border-t border-rule pt-4">
                <p className="eyebrow">Tools used</p>
                <ul className="mono mt-3 flex flex-wrap gap-1.5 text-[9.5px] text-dim">
                  {article.toolsUsed.map((tool) => (
                    <li key={tool} className="border border-rule-soft px-1.5 py-0.5">
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-7 border-t border-rule pt-4">
              <p className="eyebrow">Filed under</p>
              <p className="mt-2 text-[11.5px] leading-relaxed text-dim">
                {article.category?.name} · {article.operatingSystem || "Cross-platform"} · Issue 01
              </p>
            </div>
          </aside>
        </div>
      </article>

      {/* Prev / next */}
      {(data.previous || data.next) && (
        <nav className="border-y border-rule" aria-label="Article navigation">
          <div className="shell grid divide-y divide-rule md:grid-cols-2 md:divide-x md:divide-y-0">
            {data.previous ? (
              <Link
                to={articlePath(data.previous)}
                className="group flex flex-col gap-2 py-6 transition-colors md:pr-8"
              >
                <span className="mono flex items-center gap-2 text-[8.5px] tracking-[0.15em] text-faint uppercase">
                  <ArrowLeft size={10} /> Previous
                </span>
                <span className="text-[14.5px] leading-snug text-bone-dim transition-colors group-hover:text-bone">
                  {data.previous.title}
                </span>
              </Link>
            ) : (
              <div className="hidden py-6 md:block md:pr-8" />
            )}

            {data.next ? (
              <Link
                to={articlePath(data.next)}
                className="group flex flex-col items-start gap-2 py-6 transition-colors md:items-end md:pl-8 md:text-right"
              >
                <span className="mono flex items-center gap-2 text-[8.5px] tracking-[0.15em] text-faint uppercase">
                  Next <ArrowRight size={10} />
                </span>
                <span className="text-[14.5px] leading-snug text-bone-dim transition-colors group-hover:text-bone">
                  {data.next.title}
                </span>
              </Link>
            ) : (
              <div className="hidden py-6 md:block" />
            )}
          </div>
        </nav>
      )}

      {/* Related */}
      {data.related.length > 0 && (
        <section className="shell py-14">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
            <h2 className="mono text-[10px] font-medium tracking-[0.2em] text-bone uppercase">
              Related reading
            </h2>
            <span className="mono text-[8.5px] tracking-[0.13em] text-faint uppercase">
              Same section or tags
            </span>
          </div>

          <div className="mt-6 grid gap-px border border-rule bg-rule sm:grid-cols-3">
            {data.related.map((related) => (
              <Link
                key={related._id}
                to={articlePath(related)}
                className="group flex flex-col justify-between gap-6 bg-paper p-5 transition-colors hover:bg-paper-2"
              >
                <div>
                  <span className="mono text-[8.5px] tracking-[0.15em] text-dim uppercase">
                    {related.platform || TYPE_LABELS[related.articleType]}
                  </span>
                  <h3 className="mt-2.5 text-[15px] leading-snug text-bone-dim transition-colors group-hover:text-bone">
                    {related.title}
                  </h3>
                </div>
                <span className="mono flex items-center justify-between text-[8.5px] tracking-[0.12em] text-faint uppercase">
                  {related.readingTime} min
                  <ArrowRight
                    size={12}
                    className="text-ghost transition-colors group-hover:text-signal"
                  />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
