import { useEffect } from "react";

const SITE = "Glorison Cyber Journal";

interface MetaOptions {
  title: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  publishedAt?: string;
  author?: string;
}

function setTag(selector: string, attrs: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => element!.setAttribute(key, value));
}

export function usePageMeta({
  title,
  description,
  image,
  type = "website",
  publishedAt,
  author = "Glorison Ouma",
}: MetaOptions) {
  useEffect(() => {
    const fullTitle = title.includes(SITE) ? title : `${title} — ${SITE}`;
    document.title = fullTitle;

    if (description) {
      setTag('meta[name="description"]', { name: "description", content: description });
    }

    setTag('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    setTag('meta[property="og:type"]', { property: "og:type", content: type });
    setTag('meta[property="og:site_name"]', { property: "og:site_name", content: SITE });
    setTag('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    setTag('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });

    if (description) {
      setTag('meta[property="og:description"]', {
        property: "og:description",
        content: description,
      });
      setTag('meta[name="twitter:description"]', {
        name: "twitter:description",
        content: description,
      });
    }

    if (image) {
      const absolute = new URL(image, window.location.origin).toString();
      setTag('meta[property="og:image"]', { property: "og:image", content: absolute });
      setTag('meta[name="twitter:image"]', { name: "twitter:image", content: absolute });
    }

    if (author) setTag('meta[name="author"]', { name: "author", content: author });

    if (type === "article" && publishedAt) {
      setTag('meta[property="article:published_time"]', {
        property: "article:published_time",
        content: publishedAt,
      });
    }
  }, [title, description, image, type, publishedAt, author]);
}

export function useCanonical(path: string) {
  useEffect(() => {
    const href = new URL(path, window.location.origin).toString();
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [path]);
}
