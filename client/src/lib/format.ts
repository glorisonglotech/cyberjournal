import type { ArticleSummary, ArticleType } from "../types";

export const TYPE_LABELS: Record<ArticleType, string> = {
  "ctf-writeup": "Writeup",
  tutorial: "Tutorial",
  news: "News",
  research: "Research",
  article: "Journal",
};

export const TYPE_PATHS: Record<ArticleType, string> = {
  "ctf-writeup": "writeups",
  tutorial: "tutorials",
  news: "news",
  research: "news",
  // General articles live in the archive so breadcrumbs and links resolve to a
  // real index page (`/writeups/:slug`).
  article: "writeups",
};

export function formatDate(value?: string | null, style: "long" | "short" = "long") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDate(value)} · ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function readTime(minutes: number) {
  return `${minutes} min read`;
}

export function platformSlug(platform?: string) {
  return (platform || "ctf")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function articlePath(
  article: Pick<ArticleSummary, "slug" | "articleType"> & { platform?: string },
) {
  if (article.articleType === "ctf-writeup") {
    return `/writeups/${platformSlug(article.platform)}/${article.slug}`;
  }
  return `/${TYPE_PATHS[article.articleType]}/${article.slug}`;
}

export function difficultyTone(difficulty?: string) {
  switch ((difficulty || "").toLowerCase()) {
    case "beginner":
    case "easy":
      return "text-ok";
    case "intermediate":
    case "medium":
      return "text-warn";
    case "hard":
    case "advanced":
      return "text-hard";
    case "insane":
      return "text-signal-hot";
    default:
      return "text-dim";
  }
}

export function padIndex(value: number) {
  return String(value).padStart(2, "0");
}
