import mongoose from "mongoose";
import { Tag } from "../models/Tag.js";
import { Article } from "../models/Article.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateTag } from "../utils/validate.js";
import { uniqueSlug } from "../utils/slugify.js";

export const listTags = asyncHandler(async (_req, res) => {
  const [tags, usage] = await Promise.all([
    Tag.find().sort({ name: 1 }).lean(),
    Article.aggregate([
      { $match: { status: "published" } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const countMap = new Map(usage.map((row) => [String(row._id).toLowerCase(), row.count]));

  res.json({
    tags: tags.map((tag) => ({
      ...tag,
      articleCount: countMap.get(tag.name.toLowerCase()) || 0,
    })),
  });
});

export const createTag = asyncHandler(async (req, res) => {
  const { values, errors } = validateTag(req.body);
  if (errors.length) return res.status(422).json({ message: errors[0], errors });

  const tag = await Tag.create({
    name: values.name.toLowerCase(),
    slug: await uniqueSlug(Tag, values.name),
  });

  res.status(201).json({ tag });
});

export const deleteTag = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Malformed tag id." });
  }

  const tag = await Tag.findByIdAndDelete(req.params.id);
  if (!tag) return res.status(404).json({ message: "Tag not found." });

  res.json({ message: "Tag deleted.", id: req.params.id });
});
