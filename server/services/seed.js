import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { connectDB, disconnectDB } from "../config/db.js";
import { Article } from "../models/Article.js";
import { Category } from "../models/Category.js";
import { Tag } from "../models/Tag.js";
import { User } from "../models/User.js";
import { CATEGORY_SEED } from "../constants.js";
import { slugify } from "../utils/slugify.js";
import { ARTICLES } from "./content/articles.js";

const contentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "content", "markdown");

const EXTRA_TAGS = [
  "walkthrough",
  "web",
  "api",
  "linux",
  "privesc",
  "forensics",
  "supply-chain",
  "owasp",
  "jwt",
  "methodology",
  "bug-bounty",
  "recon",
  "burp-suite",
  "windows",
  "active-directory",
];

/**
 * Synchronises the catalogue with the database.
 *
 * - Categories, tags and the administrator are always ensured.
 * - Articles are inserted by slug; existing entries are never overwritten, so
 *   edits made in the admin desk survive a re-seed.
 * - `force` clears the article collection first — only use it on a database
 *   whose content you are willing to lose.
 */
export async function seedDatabase({ force = false } = {}) {
  if (force) {
    await Article.deleteMany({});
  }

  const existing = await Article.countDocuments();

  const categories = new Map();
  for (const definition of CATEGORY_SEED) {
    const category = await Category.findOneAndUpdate(
      { slug: definition.slug },
      { $setOnInsert: definition },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categories.set(definition.slug, category);
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "admin@glorison.local").toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      username: (process.env.ADMIN_USERNAME || "glorison").toLowerCase(),
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || "CyberJournal!2026",
      role: "admin",
    });
  }

  const tagNames = new Set([
    ...EXTRA_TAGS,
    ...ARTICLES.flatMap((article) => [...(article.tags || []), ...(article.skills || [])]),
  ]);

  for (const name of tagNames) {
    const clean = name.trim().toLowerCase();
    if (!clean) continue;
    await Tag.updateOne(
      { slug: slugify(clean) },
      { $setOnInsert: { name: clean, slug: slugify(clean) } },
      { upsert: true },
    );
  }

  let created = 0;
  let skipped = 0;
  let missingFiles = 0;

  for (const definition of ARTICLES) {
    const alreadyThere = await Article.findOne({ slug: definition.slug }).select("_id");
    if (alreadyThere) {
      skipped += 1;
      continue;
    }

    const category = categories.get(definition.categorySlug);
    if (!category) continue;

    const filePath = path.join(contentDir, definition.file);
    if (!fs.existsSync(filePath)) {
      missingFiles += 1;
      console.warn(`[seed] missing markdown file for ${definition.slug}: ${definition.file}`);
      continue;
    }

    const body = fs.readFileSync(filePath, "utf8");
    const { file, categorySlug, ...fields } = definition;

    await Article.create({
      ...fields,
      content: body,
      category: category._id,
      author: admin._id,
      status: "published",
      tags: (definition.tags || []).map((tag) => tag.toLowerCase()),
      publishedAt: new Date(definition.publishedAt),
    });

    created += 1;
  }

  return {
    seeded: created > 0,
    articles: created,
    skipped,
    missingFiles,
    existing,
    reason: created === 0 ? "catalogue already present" : undefined,
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const force = process.argv.includes("--force");
  const connection = await connectDB();
  console.log(`[seed] connected (${connection.mode})`);
  const result = await seedDatabase({ force });
  console.log(
    `[seed] ${result.articles} inserted · ${result.skipped} already present${
      result.missingFiles ? ` · ${result.missingFiles} missing files` : ""
    }`,
  );
  await disconnectDB();
  process.exit(0);
}
