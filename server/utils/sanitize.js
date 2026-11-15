/** Escapes a string for safe use inside a RegExp (search queries). */
export function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strips HTML tags, control characters and collapses whitespace. */
export function cleanText(value = "") {
  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Defence-in-depth sanitisation for stored Markdown. The client renders with
 * react-markdown (raw HTML is not parsed), but stored content is still scrubbed
 * of executable vectors so it can never be dangerous in another consumer.
 */
export function sanitizeMarkdown(value = "") {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object[\s\S]*?<\/object>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/\u0000/g, "");
}

export function normalizeStringArray(value, { max = 12, maxLength = 40 } = {}) {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .map((item) => cleanText(item).slice(0, maxLength))
          .filter(Boolean),
      ),
    ].slice(0, max);
  }
  if (typeof value === "string") {
    return normalizeStringArray(value.split(","), { max, maxLength });
  }
  return [];
}

export function isHttpUrl(value = "") {
  try {
    const url = new URL(String(value));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isEmail(value = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}
