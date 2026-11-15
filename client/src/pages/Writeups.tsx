import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { articlesApi } from "../services/api";
import { useArticles } from "../hooks/useArticles";
import { usePageMeta } from "../hooks/usePageMeta";
import { ArticleRow } from "../components/ArticleRow";
import { FilterRow, ResultSummary, type FilterOption } from "../components/ArchiveFilters";
import { EmptyState, ErrorState, PageHeader, Pagination, Spinner } from "../components/ui";
import type { Category, TagItem } from "../types";

const PLATFORMS = ["TryHackMe", "Hack The Box", "PicoCTF", "OverTheWire", "PortSwigger", "CTF"];
const DIFFICULTIES = ["Beginner", "Easy", "Intermediate", "Medium", "Advanced", "Hard", "Insane"];
const LIMIT = 8;

export default function Writeups() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);

  const page = Math.max(1, Number(params.get("page")) || 1);
  const platform = params.get("platform") || "";
  const difficulty = params.get("difficulty") || "";
  const category = params.get("category") || "";
  const tag = params.get("tag") || "";

  const { data, loading, error, refetch } = useArticles({
    articleType: "ctf-writeup,tutorial",
    platform,
    difficulty,
    category,
    tag,
    page,
    limit: LIMIT,
  });

  usePageMeta({
    title: "Writeups",
    description:
      "An archive of TryHackMe rooms, Hack The Box machines, CTF challenges and technical laboratory writeups by Glorison.",
  });

  useEffect(() => {
    let alive = true;
    Promise.all([articlesApi.categories(), articlesApi.tags()])
      .then(([categoryList, tagList]) => {
        if (!alive) return;
        setCategories(categoryList);
        setTags(tagList.filter((item) => (item.articleCount ?? 0) > 0).slice(0, 12));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  };

  const clear = () => setParams({});
  const setPage = (value: number) => {
    const next = new URLSearchParams(params);
    if (value <= 1) next.delete("page");
    else next.set("page", String(value));
    setParams(next);
    window.scrollTo({ top: 220, behavior: "smooth" });
  };

  const categoryOptions: FilterOption[] = categories
    .filter((item) => item.slug !== "cybersecurity-news")
    .map((item) => ({ value: item.slug, label: item.name, count: item.articleCount }));

  const activeFilters = [
    platform && { key: "platform", label: platform },
    difficulty && { key: "difficulty", label: difficulty },
    category && {
      key: "category",
      label: categories.find((item) => item.slug === category)?.name || category,
    },
    tag && { key: "tag", label: `#${tag}` },
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  return (
    <div className="shell pb-16 md:pb-24">
      <PageHeader
        eyebrow="Archive / field work"
        title="Writeups"
        intro="Machines rooted, rooms completed and laboratories worked through — documented with the dead ends left in, because the path matters more than the flag."
        meta={
          <p className="text-[14px] leading-relaxed text-dim">
            Platforms — TryHackMe · Hack The Box · PicoCTF · OverTheWire · PortSwigger · CTF
          </p>
        }
      />

      <div className="mt-8 border-y border-rule">
        <FilterRow
          label="Platform"
          value={platform}
          onChange={(value) => update("platform", value)}
          options={PLATFORMS.map((item) => ({ value: item, label: item }))}
        />
        <FilterRow
          label="Difficulty"
          value={difficulty}
          onChange={(value) => update("difficulty", value)}
          options={DIFFICULTIES.map((item) => ({ value: item, label: item }))}
        />
        <FilterRow
          label="Category"
          value={category}
          onChange={(value) => update("category", value)}
          options={categoryOptions}
        />
        {tags.length > 0 && (
          <FilterRow
            label="Tag"
            value={tag}
            onChange={(value) => update("tag", value)}
            options={tags.map((item) => ({
              value: item.name,
              label: item.name,
              count: item.articleCount,
            }))}
          />
        )}
      </div>

      {data && (
        <ResultSummary
          shown={data.articles.length}
          total={data.pagination.total}
          page={data.pagination.page}
          limit={LIMIT}
          activeFilters={activeFilters}
          onClear={clear}
        />
      )}

      {loading && <Spinner label="Fetching archive" />}

      {error && !loading && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && data && (
        <>
          {data.articles.length === 0 ? (
            <EmptyState
              title="Nothing filed under this combination"
              description="No entries match those filters. Try a single platform, or browse the tutorial library for the technique you are after."
            >
              <div className="flex flex-wrap justify-center gap-3">
                {activeFilters.length > 0 && (
                  <button type="button" className="btn btn-ghost" onClick={clear}>
                    Clear filters
                  </button>
                )}
                <Link to="/tutorials" className="btn btn-ghost">
                  Browse tutorials
                </Link>
              </div>
            </EmptyState>
          ) : (
            <div className="mt-2 border-b border-rule">
              {data.articles.map((article, index) => (
                <ArticleRow
                  key={article._id}
                  article={article}
                  index={(page - 1) * LIMIT + index + 1}
                  showCover
                />
              ))}
            </div>
          )}

          <div className="mt-10">
            <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}