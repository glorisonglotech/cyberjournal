import { Article } from "../models/Article.js";
import { Category } from "../models/Category.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/sanitize.js";

const LIST_FIELDS = "-content -seoTitle -seoDescription";

export const dashboard = asyncHandler(async (_req, res) => {
  const [total, published, drafts, featured, categories, recent, byType, byPlatform] =
    await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ status: "published" }),
      Article.countDocuments({ status: "draft" }),
      Article.countDocuments({ featured: true, status: "published" }),
      Category.countDocuments(),
      Article.find()
        .select("title slug status articleType updatedAt readingTime")
        .sort({ updatedAt: -1 })
        .limit(6)
        .lean(),
      Article.aggregate([{ $group: { _id: "$articleType", count: { $sum: 1 } } }]),
      Article.aggregate([
        { $match: { platform: { $nin: ["", null] } } },
        { $group: { _id: "$platform", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  res.json({
    counts: { total, published, drafts, featured, categories },
    recent,
    byType,
    byPlatform,
  });
});

export const listAllArticles = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));

  const filter = {};
  if (req.query.status && req.query.status !== "all") filter.status = req.query.status;
  if (req.query.articleType) filter.articleType = req.query.articleType;

  const term = String(req.query.q || "").trim().slice(0, 80);
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }];
  }

  const [articles, total] = await Promise.all([
    Article.find(filter)
      .select(LIST_FIELDS)
      .populate("category", "name slug")
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
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

export const getArticleForEdit = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id)
    .populate("category", "name slug")
    .lean();

  if (!article) return res.status(404).json({ message: "Article not found." });
  res.json({ article });
});

export const stats = asyncHandler(async (_req, res) => {
  const [totals, tagUsage, tools, latest] = await Promise.all([
    Article.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] } },
          drafts: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
          avgReadingTime: { $avg: "$readingTime" },
        },
      },
    ]),
    Article.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Article.aggregate([
      { $unwind: "$toolsUsed" },
      { $group: { _id: "$toolsUsed", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Article.findOne({ status: "published" })
      .select("title slug publishedAt articleType platform")
      .sort({ publishedAt: -1 })
      .lean(),
  ]);

  res.json({
    totals: totals[0] || { total: 0, published: 0, drafts: 0, avgReadingTime: 0 },
    topTags: tagUsage,
    topTools: tools,
    latestPublished: latest,
  });
});
