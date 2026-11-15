import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import type { ArticleSummary } from "../types";
import { articlePath, difficultyTone, formatDate, padIndex, TYPE_LABELS } from "../lib/format";
import { SampleBadge } from "./ui";
import { assetUrl } from "../services/api";

export function ArticleRow({
  article,
  index,
  showCover = false,
}: {
  article: ArticleSummary;
  index: number;
  showCover?: boolean;
}) {
  return (
    <article className="group border-t border-rule">
      <Link
        to={articlePath(article)}
        className="grid grid-cols-1 items-start gap-4 py-7 md:grid-cols-[2rem_1fr_auto] md:gap-8"
      >
        <span className="mono hidden pt-2 text-[13px] text-dim md:block">{padIndex(index)}</span>

        <div className={showCover ? "grid gap-6 sm:grid-cols-[200px_1fr]" : ""}>
          {showCover && article.coverImage && (
            <div className="relative hidden self-start overflow-hidden rounded-sm border border-rule bg-paper transition-colors group-hover:border-ghost sm:block">
              <img
                src={assetUrl(article.coverImage)}
                alt=""
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px]">
              <span className="font-semibold text-signal">
                {article.platform || TYPE_LABELS[article.articleType]}
              </span>
              {article.difficulty && (
                <>
                  <span className="text-ghost" aria-hidden="true">
                    /
                  </span>
                  <span className={difficultyTone(article.difficulty)}>{article.difficulty}</span>
                </>
              )}
              {article.operatingSystem && (
                <>
                  <span className="text-ghost" aria-hidden="true">
                    /
                  </span>
                  <span className="text-dim">{article.operatingSystem}</span>
                </>
              )}
              {article.isSample && <SampleBadge />}
            </div>

            <h3 className="balance mt-2.5 font-serif text-[22px] leading-[1.15] font-medium tracking-[-0.015em] text-bone transition-colors group-hover:text-signal md:text-[26px]">
              {article.title}
            </h3>

            <p className="mt-3 line-clamp-2 max-w-2xl text-[16px] leading-relaxed text-bone-dim">
              {article.excerpt}
            </p>

            {article.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
                {article.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="mono text-[13px] text-dim">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 text-[14px] md:flex-col md:items-end md:justify-start md:gap-2 md:pt-1">
          <span className="text-bone-dim">{formatDate(article.publishedAt, "short")}</span>
          <span className="flex items-center gap-1.5 text-dim">
            {article.readingTime} min
            <ArrowUpRight
              size={15}
              className="text-ghost transition-colors group-hover:text-signal"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}