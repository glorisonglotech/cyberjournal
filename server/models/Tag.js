import mongoose from "mongoose";
import { slugify } from "../utils/slugify.js";

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      unique: true,
      maxlength: 40,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true },
);

tagSchema.pre("validate", function setSlug(next) {
  if (!this.slug && this.name) this.slug = slugify(this.name);
  next();
});

export const Tag = mongoose.model("Tag", tagSchema);
