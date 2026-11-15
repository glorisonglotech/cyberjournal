import { useEffect, useState, type FormEvent } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { adminApi, articlesApi, errorMessage } from "../../services/api";
import type { Category, TagItem } from "../../types";
import { usePageMeta } from "../../hooks/usePageMeta";
import { ErrorState, Spinner } from "../../components/ui";

/* Sizes and case are set here so the page reads the same under any stylesheet. */
const INPUT = "field !py-2.5 !text-[16px]";
const SECTION_HEAD = "border-b border-rule pb-3 text-[15px] font-semibold text-bone";
const ICON_BTN =
  "inline-flex h-9 w-9 items-center justify-center rounded-sm text-dim transition-colors hover:bg-paper-2";

export default function Taxonomy() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagName, setTagName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string; description: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  usePageMeta({ title: "Taxonomy — Admin", description: "Manage categories and tags." });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoryList, tagList] = await Promise.all([
        articlesApi.categories(),
        articlesApi.tags(),
      ]);
      setCategories(categoryList);
      setTags(tagList);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const addCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.createCategory({ name, description });
      setName("");
      setDescription("");
      setNotice("Category created.");
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const saveCategory = async () => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.updateCategory(editing.id, {
        name: editing.name,
        description: editing.description,
      });
      setEditing(null);
      setNotice("Category updated.");
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const removeCategory = async (category: Category) => {
    if (!window.confirm(`Delete the “${category.name}” category?`)) return;
    setError(null);
    try {
      await adminApi.removeCategory(category._id);
      setNotice("Category deleted.");
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  const addTag = async (event: FormEvent) => {
    event.preventDefault();
    if (!tagName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.createTag(tagName.trim());
      setTagName("");
      setNotice("Tag added.");
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  const removeTag = async (tag: TagItem) => {
    if (!window.confirm(`Remove the “${tag.name}” tag from the vocabulary?`)) return;
    setError(null);
    try {
      await adminApi.removeTag(tag._id);
      setNotice("Tag removed.");
      await load();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  };

  return (
    <div>
      <div className="border-b border-rule pb-8">
        <p className="text-[15px] font-medium text-signal">Editorial desk</p>
        <h1 className="display mt-3 font-serif text-[clamp(2.2rem,4.6vw,3.2rem)] leading-[1.05] font-medium tracking-[-0.025em] text-bone">
          Categories &amp; tags
        </h1>
        <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-dim">
          Categories group articles into sections. Tags are the vocabulary used for filtering and
          search — keep them lowercase and specific.
        </p>
      </div>

      {error && (
        <div className="mt-6">
          <ErrorState message={error} />
        </div>
      )}
      {notice && (
        <p className="mt-6 rounded-sm border border-l-[3px] border-rule border-l-ok bg-paper px-5 py-3 text-[15px] text-ok">
          {notice}
        </p>
      )}

      {loading ? (
        <Spinner label="Loading taxonomy" />
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.25fr_1fr]">
          <section>
            <h2 className={SECTION_HEAD}>
              Categories · {String(categories.length).padStart(2, "0")}
            </h2>

            <form onSubmit={addCategory} className="mt-5 rounded-sm bg-paper-2 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Category name"
                  aria-label="New category name"
                  className={INPUT}
                  required
                  minLength={2}
                />
                <input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Short description (optional)"
                  aria-label="New category description"
                  className={INPUT}
                  maxLength={240}
                />
              </div>
              <button type="submit" className="btn btn-primary mt-4" disabled={busy}>
                Add category
              </button>
            </form>

            <div className="mt-5 divide-y divide-rule border-y border-rule">
              {categories.map((category) =>
                editing?.id === category._id ? (
                  <div key={category._id} className="space-y-3 py-5">
                    <input
                      value={editing.name}
                      onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                      className={INPUT}
                      aria-label="Category name"
                    />
                    <input
                      value={editing.description}
                      onChange={(event) =>
                        setEditing({ ...editing, description: event.target.value })
                      }
                      className={INPUT}
                      placeholder="Description"
                      aria-label="Category description"
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={saveCategory}
                        disabled={busy}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setEditing(null)}
                      >
                        <X size={15} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={category._id} className="flex items-start justify-between gap-4 py-5">
                    <div className="min-w-0">
                      <p className="text-[17px] text-bone">
                        {category.name}
                        <span className="mono ml-3 text-[13px] text-faint">/{category.slug}</span>
                      </p>
                      {category.description && (
                        <p className="mt-1.5 text-[15px] leading-relaxed text-dim">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <span className="mono mr-2 text-[14px] text-dim">
                        {String(category.articleCount ?? 0).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditing({
                            id: category._id,
                            name: category.name,
                            description: category.description || "",
                          })
                        }
                        className={`${ICON_BTN} hover:text-bone`}
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCategory(category)}
                        className={`${ICON_BTN} hover:text-signal`}
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          <section>
            <h2 className={SECTION_HEAD}>Tags · {String(tags.length).padStart(2, "0")}</h2>

            <form onSubmit={addTag} className="mt-5 flex gap-3">
              <input
                value={tagName}
                onChange={(event) => setTagName(event.target.value)}
                placeholder="new-tag"
                aria-label="New tag"
                className={`${INPUT} field-mono`}
                maxLength={40}
                required
                minLength={2}
              />
              <button type="submit" className="btn btn-primary" disabled={busy}>
                Add
              </button>
            </form>

            <ul className="mt-5 flex flex-wrap gap-2.5">
              {tags.map((tag) => (
                <li
                  key={tag._id}
                  className="group flex items-center gap-2.5 rounded-sm border border-rule py-1 pr-1 pl-3"
                >
                  <span className="mono text-[14px] text-bone">#{tag.name}</span>
                  <span className="text-[13px] text-faint">{tag.articleCount ?? 0}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-faint transition-colors hover:bg-paper-2 hover:text-signal"
                    aria-label={`Delete tag ${tag.name}`}
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
              {tags.length === 0 && <li className="text-[15px] text-dim">No tags yet.</li>}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}