import {
  cleanText,
  isEmail,
  isHttpUrl,
  normalizeStringArray,
  sanitizeMarkdown,
} from "./sanitize.js";
import {
  ARTICLE_TYPES,
  DIFFICULTIES,
  OPERATING_SYSTEMS,
  PLATFORMS,
  STATUSES,
} from "../constants.js";

/** Validates and normalises the login payload. */
export function validateLogin(body = {}) {
  const errors = [];
  const identifier = cleanText(body.identifier ?? body.email ?? body.username ?? "");
  const password = typeof body.password === "string" ? body.password : "";

  if (!identifier) errors.push("Email or username is required.");
  if (!password) errors.push("Password is required.");
  if (password.length > 200) errors.push("Password is too long.");

  return { values: { identifier, password }, errors };
}

/**
 * Validates and normalises an article payload. Only supplied fields are
 * returned for updates, so partial documents can be patched safely.
 */
export function validateArticle(body = {}, { partial = false } = {}) {
  const errors = [];
  const values = {};

  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  if (!partial || has("title")) {
    const title = cleanText(body.title);
    if (title.length < 6) errors.push("Title must be at least 6 characters.");
    if (title.length > 180) errors.push("Title must be 180 characters or fewer.");
    values.title = title;
  }

  if (!partial || has("excerpt")) {
    const excerpt = cleanText(body.excerpt);
    if (excerpt.length < 20) errors.push("Excerpt must be at least 20 characters.");
    if (excerpt.length > 400) errors.push("Excerpt must be 400 characters or fewer.");
    values.excerpt = excerpt;
  }

  if (!partial || has("content")) {
    const content = sanitizeMarkdown(body.content ?? "");
    if (content.trim().length < 80) {
      errors.push("Content must be at least 80 characters of Markdown.");
    }
    values.content = content;
  }

  if (!partial || has("category")) {
    const category = cleanText(body.category?._id ?? body.category ?? "");
    if (!/^[a-f0-9]{24}$/i.test(category)) errors.push("A valid category is required.");
    values.category = category;
  }

  if (!partial || has("articleType")) {
    const articleType = body.articleType || "article";
    if (!ARTICLE_TYPES.includes(articleType)) errors.push("Unknown article type.");
    values.articleType = articleType;
  }

  if (has("platform") || !partial) {
    const platform = cleanText(body.platform ?? "");
    if (platform && !PLATFORMS.includes(platform)) errors.push("Unknown platform.");
    values.platform = platform;
  }

  if (has("difficulty") || !partial) {
    const difficulty = cleanText(body.difficulty ?? "");
    if (difficulty && !DIFFICULTIES.includes(difficulty)) {
      errors.push("Unknown difficulty.");
    }
    values.difficulty = difficulty;
  }

  if (has("operatingSystem") || !partial) {
    const operatingSystem = cleanText(body.operatingSystem ?? "");
    if (operatingSystem && !OPERATING_SYSTEMS.includes(operatingSystem)) {
      errors.push("Unknown operating system.");
    }
    values.operatingSystem = operatingSystem;
  }

  if (has("status") || !partial) {
    const status = body.status || "draft";
    if (!STATUSES.includes(status)) errors.push("Status must be draft or published.");
    values.status = status;
  }

  if (has("featured")) values.featured = Boolean(body.featured);

  if (has("coverImage") || !partial) {
    const coverImage = cleanText(body.coverImage ?? "");
    if (coverImage && !(coverImage.startsWith("/uploads/") || isHttpUrl(coverImage))) {
      errors.push("Cover image must be an uploaded file path or an https URL.");
    }
    values.coverImage = coverImage;
  }

  if (has("tags") || !partial) values.tags = normalizeStringArray(body.tags, { max: 12 });
  if (has("skills") || !partial) {
    values.skills = normalizeStringArray(body.skills, { max: 12, maxLength: 60 });
  }
  if (has("toolsUsed") || !partial) {
    values.toolsUsed = normalizeStringArray(body.toolsUsed, { max: 20, maxLength: 60 });
  }

  if (has("seoTitle") || !partial) {
    values.seoTitle = cleanText(body.seoTitle ?? "").slice(0, 70);
  }
  if (has("seoDescription") || !partial) {
    values.seoDescription = cleanText(body.seoDescription ?? "").slice(0, 170);
  }

  if (has("isSample")) values.isSample = Boolean(body.isSample);

  if (has("source")) {
    const name = cleanText(body.source?.name ?? "").slice(0, 160);
    const url = cleanText(body.source?.url ?? "").slice(0, 500);
    if (url && !isHttpUrl(url)) errors.push("Source link must be an http(s) URL.");
    values.source = name || url ? { name, url } : undefined;
  }

  return { values, errors };
}

export function validateCategory(body = {}) {
  const errors = [];
  const name = cleanText(body.name);
  const description = cleanText(body.description ?? "");

  if (name.length < 2) errors.push("Category name must be at least 2 characters.");
  if (name.length > 60) errors.push("Category name must be 60 characters or fewer.");
  if (description.length > 240) errors.push("Description must be 240 characters or fewer.");

  return { values: { name, description }, errors };
}

export function validateTag(body = {}) {
  const errors = [];
  const name = cleanText(body.name);
  if (name.length < 2) errors.push("Tag name must be at least 2 characters.");
  if (name.length > 40) errors.push("Tag name must be 40 characters or fewer.");
  return { values: { name }, errors };
}

export { isEmail };
