export function slugify(value = "") {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

/**
 * Returns a slug that is not already used by another document.
 * Appends -2, -3, ... when a collision is found.
 */
export async function uniqueSlug(Model, base, excludeId = null) {
  const root = slugify(base) || "article";
  let candidate = root;
  let counter = 2;

  /* eslint-disable no-await-in-loop */
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Model.exists(query);
    if (!exists) return candidate;
    candidate = `${root}-${counter}`;
    counter += 1;
  }
}
