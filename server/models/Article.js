import mongoose from "mongoose";
import { slugify } from "../utils/slugify.js";
import { calculateReadingTime } from "../utils/readingTime.js";
import {
  ARTICLE_TYPES,
  DIFFICULTIES,
  OPERATING_SYSTEMS,
  PLATFORMS,
  STATUSES,
} from "../constants.js";

const sourceSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 160 },
    url: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 180,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      trim: true,
      maxlength: 400,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    coverImage: { type: String, trim: true, default: "" },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    articleType: {
      type: String,
      enum: ARTICLE_TYPES,
      default: "article",
      index: true,
    },
    platform: {
      type: String,
      enum: [...PLATFORMS, ""],
      default: "",
    },
    difficulty: {
      type: String,
      enum: [...DIFFICULTIES, ""],
      default: "",
    },
    operatingSystem: {
      type: String,
      enum: [...OPERATING_SYSTEMS, ""],
      default: "",
    },
    skills: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    toolsUsed: { type: [String], default: [] },
    featured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: STATUSES,
      default: "draft",
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    readingTime: { type: Number, default: 1, min: 1 },
    seoTitle: { type: String, trim: true, maxlength: 70, default: "" },
    seoDescription: { type: String, trim: true, maxlength: 170, default: "" },
    source: { type: sourceSchema, default: undefined },
    isSample: { type: Boolean, default: false },
    publishedAt: { type: Date, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

articleSchema.index({ title: 1, tags: 1, platform: 1 });

articleSchema.pre("validate", function normalise(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }
  if (this.content) {
    this.readingTime = calculateReadingTime(this.content);
  }
  if (this.status === "published" && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  if (Array.isArray(this.tags)) {
    this.tags = [...new Set(this.tags.map((t) => t.trim()).filter(Boolean))];
  }
  next();
});

export const Article = mongoose.model("Article", articleSchema);
