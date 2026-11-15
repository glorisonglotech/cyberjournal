import mongoose from "mongoose";
import { Article } from "../models/Article.js";
import { Category } from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/sanitize.js";
import { uniqueSlug } from "../utils/slugify.js";
import { validateArticle } from "../utils/validate.js";
import { ARTICLE_TYPES } from "../constants.js";

const LIST_FIELDS = "-content -seoTitle -seoDescription";
const MAX_LIMIT = 24;

const POPULATE = [
  { path: "category", select: "name slug description" },
  { path: "author", select: "username role" },
];

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.parseInt(query.limit, 10) || 9));
  return { page, limit, skip: (page - 1) * limit };
}

function sortFor(value) {
  switch (value) {
    case "oldest":
      return { publishedAt: 1 };
    case "reading":
      return { readingTime: -1 };
    case "title":
      return { title: 1 };
    default:
      return { publishedAt: -1, createdAt: -1 };
  }
}

async function buildFilters(query, { publicOnly = true } = {}) {
  const filter = {};
  if (publicOnly) filter.status = "published";

  if (query.platform) filter.platform = query.platform;
  if (query.difficulty) filter.difficulty = query.difficulty;

  if (query.articleType) {
    const types = String(query.articleType)
      .split(",")
      .map((value) => value.trim())
      .filter((value) => ARTICLE_TYPES.includes(value));
    if (types.length === 1) filter.articleType = types[0];
    if (types.length > 1) filter.articleType = { $in: types };
  }
  if (query.tag) filter.tags = { $in: [String(query.tag).toLowerCase()] };

  if (query.category) {
    const category = await Category.findOne({ slug: String(query.category) }).select("_id");
    filter.category = category ? category._id : new mongoose.Types.ObjectId();
  }

  return filter;
}

export const listArticles = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const filter = await buildFilters(req.query);

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .select(LIST_FIELDS)
      .populate(POPULATE)
      .sort(sortFor(req.query.sort))
      .skip(skip)
      .limit(limit)
      .lean(),
    Article.countDocuments(filter),
  ]);

  res.json({
    articles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      hasMore: page * limit < total,
    },
  });
});

export const getArticleBySlug = asyncHandler(async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug, status: "published" })
    .populate(POPULATE)
    .lean();

  if (!article) {
    return res.status(404).json({ message: "That article does not exist." });
  }

  const relatedCriteria = [];
  if (article.category?._id) relatedCriteria.push({ category: article.category._id });
  if (article.tags?.length) relatedCriteria.push({ tags: { $in: article.tags } });
  if (article.articleType) relatedCriteria.push({ articleType: article.articleType });

  const [related, previous, next] = await Promise.all([
    Article.find({
      _id: { $ne: article._id },
      status: "published",
      ...(relatedCriteria.length ? { $or: relatedCriteria } : {}),
    })
      .select(LIST_FIELDS)
      .populate(POPULATE)
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean(),
    Article.findOne({ status: "published", publishedAt: { $lt: article.publishedAt } })
      .select("title slug articleType platform")
      .sort({ publishedAt: -1 })
      .lean(),
    Article.findOne({ status: "published", publishedAt: { $gt: article.publishedAt } })
      .select("title slug articleType platform")
      .sort({ publishedAt: 1 })
      .lean(),
  ]);

  res.json({ article, related, previous, next });
});

/** Public, published-only counts used by the homepage dashboard panel. */
export const getPublicStats = asyncHandler(async (_req, res) => {
  const [byType, byPlatform] = await Promise.all([
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$articleType", count: { $sum: 1 } } },
    ]),
    Article.aggregate([
      { $match: { status: "published", platform: { $nin: ["", null] } } },
      { $group: { _id: "$platform", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const countOf = (type) => byType.find((row) => row._id === type)?.count || 0;

  res.json({
    totals: {
      published: byType.reduce((sum, row) => sum + row.count, 0),
      writeups: countOf("ctf-writeup"),
      tutorials: countOf("tutorial"),
      platforms: byPlatform.length,
    },
    byType,
    byPlatform,
  });
});

export const getFeatured = asyncHandler(async (_req, res) => {
  const featured = await Article.findOne({ status: "published", featured: true })
    .select(LIST_FIELDS)
    .populate(POPULATE)
    .sort({ publishedAt: -1 })
    .lean();

  if (featured) return res.json({ article: featured });

  const fallback = await Article.findOne({ status: "published" })
    .select(LIST_FIELDS)
    .populate(POPULATE)
    .sort({ publishedAt: -1 })
    .lean();

  return res.json({ article: fallback });
});

export const searchArticles = asyncHandler(async (req, res) => {
  const started = Date.now();
  const term = String(req.query.q || "").trim().slice(0, 80);

  if (term.length < 2) {
    return res.json({ articles: [], total: 0, term, took: 0 });
  }

  const rx = new RegExp(escapeRegex(term), "i");
  const categories = await Category.find({ $or: [{ name: rx }, { slug: rx }] })
    .select("_id")
    .lean();

  const filter = {
    status: "published",
    $or: [
      { title: rx },
      { excerpt: rx },
      { content: rx },
      { tags: rx },
      { toolsUsed: rx },
      { skills: rx },
      { platform: rx },
      { articleType: rx },
      ...(categories.length ? [{ category: { $in: categories.map((c) => c._id) } }] : []),
    ],
  };

  const limit = Math.min(40, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .select(LIST_FIELDS)
      .populate(POPULATE)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean(),
    Article.countDocuments(filter),
  ]);

  res.json({ articles, total, term, took: Date.now() - started });
});

export const createArticle = asyncHandler(async (req, res) => {
  const { values, errors } = validateArticle(req.body);
  if (errors.length) return res.status(422).json({ message: errors[0], errors });

  const category = await Category.findById(values.category).select("_id");
  if (!category) return res.status(422).json({ message: "Selected category no longer exists." });

  if (values.featured) {
    await Article.updateMany({ featured: true }, { $set: { featured: false } });
  }

  if (values.articleType === "news" && values.status === "published") {
    if (!values.source?.name || !values.source?.url) {
      return res.status(422).json({
        message: "News entries need the original source name and link before publishing.",
      });
    }
  }

  const slug = await uniqueSlug(Article, req.body.slug || values.title);

  const article = await Article.create({
    ...values,
    slug,
    author: req.user._id,
  });

  await article.populate(POPULATE);
  res.status(201).json({ article });
});

export const updateArticle = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Malformed article id." });
  }

  const article = await Article.findById(req.params.id);
  if (!article) return res.status(404).json({ message: "Article not found." });

  const { values, errors } = validateArticle(req.body, { partial: true });
  if (errors.length) return res.status(422).json({ message: errors[0], errors });

  if (values.category) {
    const category = await Category.findById(values.category).select("_id");
    if (!category) return res.status(422).json({ message: "Selected category no longer exists." });
  }

  if (values.featured) {
    await Article.updateMany(
      { featured: true, _id: { $ne: article._id } },
      { $set: { featured: false } },
    );
  }

  if (req.body.title && req.body.title !== article.title && req.body.regenerateSlug) {
    values.slug = await uniqueSlug(Article, values.title ?? req.body.title, article._id);
  }

  Object.assign(article, values);

  if (
    article.articleType === "news" &&
    article.status === "published" &&
    (!article.source?.name || !article.source?.url)
  ) {
    return res.status(422).json({
      message: "News entries need the original source name and link before publishing.",
    });
  }

  if (article.status === "published" && !article.publishedAt) {
    article.publishedAt = new Date();
  }

  await article.save();
  await article.populate(POPULATE);

  res.json({ article });
});

export const deleteArticle = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Malformed article id." });
  }

  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) return res.status(404).json({ message: "Article not found." });

  res.json({ message: "Article deleted.", id: req.params.id });
});
