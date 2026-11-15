/**
 * Catalogue helpers.
 *
 * Entries are declared as tuples to keep ~50 content definitions readable and
 * consistent. Every row maps to a full Article document in the seeder.
 */

/* slug, title, excerpt, difficulty, category, tags, tools, skills, publishedAt, os */
export function buildTutorials(rows) {
  return rows.map(
    ([slug, title, excerpt, difficulty, categorySlug, tags, tools, skills, publishedAt, os = "Web"]) => ({
      slug,
      title,
      excerpt,
      file: `${slug}.md`,
      categorySlug,
      articleType: "tutorial",
      platform: "",
      difficulty,
      operatingSystem: os,
      skills,
      tags,
      toolsUsed: tools,
      coverImage: "",
      featured: false,
      publishedAt: `${publishedAt}T09:00:00.000Z`,
      seoTitle: title.slice(0, 70),
      seoDescription: excerpt.slice(0, 170),
      isSample: false,
    }),
  );
}

/* slug, title, excerpt, platform, difficulty, os, category, skills, tags, tools, publishedAt */
export function buildWriteups(rows) {
  return rows.map(
    ([slug, title, excerpt, platform, difficulty, os, categorySlug, skills, tags, tools, publishedAt]) => ({
      slug,
      title,
      excerpt,
      file: `${slug}.md`,
      categorySlug,
      articleType: "ctf-writeup",
      platform,
      difficulty,
      operatingSystem: os,
      skills,
      tags,
      toolsUsed: tools,
      coverImage: "",
      featured: false,
      publishedAt: `${publishedAt}T08:00:00.000Z`,
      seoTitle: title.slice(0, 70),
      seoDescription: excerpt.slice(0, 170),
      // Platform write-ups are methodology records with redacted values, so the
      // interface labels them as demonstrations rather than verified solves.
      isSample: true,
    }),
  );
}
