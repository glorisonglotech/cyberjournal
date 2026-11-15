import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";
import { articlesApi, errorMessage } from "../services/api";
import { useDebounced } from "../hooks/useArticles";
import { usePageMeta } from "../hooks/usePageMeta";
import { ArticleRow } from "../components/ArticleRow";
import { ErrorState, Spinner } from "../components/ui";
import type { Category, SearchResponse, TagItem } from "../types";

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [query, setQuery] = useState(initial);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebounced(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  usePageMeta({
    title: "Search",
    description:
      "Search the Glorison Cyber Journal archive by title, technique, platform, tool or tag.",
  });

  useEffect(() => {
    inputRef.current?.focus();
    Promise.all([articlesApi.categories(), articlesApi.tags()])
      .then(([categoryList, tagList]) => {
        setCategories(categoryList);
        setTags(tagList.filter((tag) => (tag.articleCount ?? 0) > 0).slice(0, 14));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const next = new URLSearchParams(params);
    if (debounced.trim()) next.set("q", debounced.trim());
    else next.delete("q");
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    let alive = true;
    const term = debounced.trim();

    if (term.length < 2) {
      setResults(null);
      setError(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError(null);

    articlesApi
      .search(term)
      .then((response) => {
        if (alive) setResults(response);
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
  }, [debounced]);

  return (
    <div className="shell">
      <header className="border-b border-rule pt-12 pb-9">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-signal" aria-hidden="true" />
          <span className="eyebrow">Index / query</span>
        </div>

        <h1 className="display mt-5 text-[clamp(2.3rem,5vw,3.5rem)] text-bone">Search</h1>

        <div className="relative mt-8 max-w-3xl border-b border-rule transition-colors focus-within:border-signal">
          <SearchIcon
            size={16}
            className="absolute top-1/2 left-0 -translate-y-1/2 text-faint"
            strokeWidth={1.8}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, techniques, tools, tags…"
            aria-label="Search the journal"
            className="w-full border-0 bg-transparent py-3.5 pr-10 pl-7 text-[16.5px] tracking-[-0.01em] text-bone placeholder:text-faint focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-1 -translate-y-1/2 text-dim transition-colors hover:text-bone"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <p className="mono mt-3 text-[8.5px] tracking-[0.13em] text-faint uppercase">
          Searches article bodies, tags, platforms, tools and categories · Two characters minimum
        </p>
      </header>

      <div className="min-h-[40vh] py-8">
        {loading && <Spinner label="Searching the archive" />}
        {error && !loading && <ErrorState message={error} />}

        {!loading && !error && results && (
          <>
            <p className="mono border-b border-rule pb-3 text-[9px] tracking-[0.13em] text-dim uppercase">
              {results.total} result{results.total === 1 ? "" : "s"} for “{results.term}” ·{" "}
              {results.took}ms
            </p>

            {results.articles.length === 0 ? (
              <div className="py-14">
                <span className="mono text-[11px] text-ghost">00</span>
                <p className="mono mt-2 text-[9.5px] tracking-[0.2em] text-faint uppercase">
                  No match
                </p>
                <h2 className="mt-3 text-[20px] font-medium tracking-[-0.02em] text-bone">
                  Nothing in the archive uses that term
                </h2>
                <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-bone-dim">
                  Try a broader technique (injection, privesc), a platform name, or a tool you
                  remember being mentioned.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["sql", "linux", "api", "tryhackme"].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="chip"
                      onClick={() => setQuery(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border-b border-rule">
                {results.articles.map((article, index) => (
                  <ArticleRow key={article._id} article={article} index={index + 1} showCover />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && !results && (
          <div className="grid gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <h2 className="eyebrow border-b border-rule pb-2.5">Browse sections</h2>
              <ul className="mt-1">
                {categories.map((category) => (
                  <li key={category._id} className="border-b border-rule-soft">
                    <Link
                      to={
                        category.slug === "tutorials"
                          ? "/tutorials"
                          : category.slug === "cybersecurity-news"
                            ? "/news"
                            : `/writeups?category=${category.slug}`
                      }
                      className="group flex items-baseline justify-between py-3"
                    >
                      <span className="text-[13.5px] text-bone-dim transition-colors group-hover:text-bone">
                        {category.name}
                      </span>
                      <span className="mono text-[9px] text-faint">
                        {String(category.articleCount ?? 0).padStart(2, "0")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="eyebrow border-b border-rule pb-2.5">Frequent tags</h2>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <button
                    key={tag._id}
                    type="button"
                    className="chip"
                    onClick={() => setQuery(tag.name)}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>

              <p className="mt-8 border-t border-rule pt-5 text-[13px] leading-relaxed text-dim">
                Looking for a specific machine? Search the platform name, or open{" "}
                <Link
                  to="/writeups"
                  className="text-bone-dim underline decoration-rule underline-offset-4 transition-colors hover:text-signal"
                >
                  the archive
                </Link>{" "}
                and filter by platform and difficulty.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
