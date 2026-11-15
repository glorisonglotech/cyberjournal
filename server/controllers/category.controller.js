import mongoose from "mongoose";
import { Category } from "../models/Category.js";
import { Article } from "../models/Article.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateCategory } from "../utils/validate.js";
import { uniqueSlug } from "../utils/slugify.js";

export const listCategories = asyncHandler(async (_req, res) => {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ name: 1 }).lean(),
    Article.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));

  res.json({
    categories: categories.map((category) => ({
      ...category,
      articleCount: countMap.get(String(category._id)) || 0,
    })),
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { values, errors } = validateCategory(req.body);
  if (errors.length) return res.status(422).json({ message: errors[0], errors });

  const category = await Category.create({
    ...values,
    slug: await uniqueSlug(Category, values.name),
  });

  res.status(201).json({ category: { ...category.toObject(), articleCount: 0 } });
});

export const updateCategory = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Malformed category id." });
  }

  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found." });

  if (!req.body.name && typeof req.body.description !== "string") {
    return res.status(422).json({ message: "Nothing to update." });
  }

  if (req.body.name) {
    const previousName = category.name;
    const { values, errors } = validateCategory(req.body);
    if (errors.length) return res.status(422).json({ message: errors[0], errors });
    category.name = values.name;
    category.description = values.description ?? category.description;
    if (values.name.toLowerCase() !== previousName.toLowerCase()) {
      category.slug = await uniqueSlug(Category, values.name, category._id);
    }
  } else if (typeof req.body.description === "string") {
    category.description = req.body.description.trim().slice(0, 240);
  }

  await category.save();
  res.json({ category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Malformed category id." });
  }

  const inUse = await Article.countDocuments({ category: req.params.id });
  if (inUse > 0) {
    return res.status(409).json({
      message: `This category still holds ${inUse} article${inUse === 1 ? "" : "s"}. Move them first.`,
    });
  }

  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found." });

  res.json({ message: "Category deleted.", id: req.params.id });
});
