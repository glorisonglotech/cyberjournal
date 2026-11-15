import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, ImagePlus, Loader2, Upload } from "lucide-react";
import { adminApi, articlesApi, assetUrl, errorMessage, uploadImage } from "../../services/api";
import type { ArticleStatus, ArticleType, Category } from "../../types";
import { usePageMeta } from "../../hooks/usePageMeta";
import { ErrorState, Spinner } from "../../components/ui";
import { MarkdownContent } from "../../components/MarkdownContent";
import { articlePath, TYPE_LABELS } from "../../lib/format";

const TYPES: Array<{ value: ArticleType; label: string }> = [
  { value: "ctf-writeup", label: "CTF Writeup" },
  { value: "tutorial", label: "Tutorial" },
  { value: "news", label: "Cybersecurity News" },
  { value: "research", label: "Research" },
  { value: "article", label: "General Article" },
];

const PLATFORMS = ["", "TryHackMe", "Hack The Box", "PicoCTF", "OverTheWire", "PortSwigger", "CTF"];
const MACHINE_DIFFICULTY = ["", "Easy", "Medium", "Hard", "Insane"];
const LEARNING_DIFFICULTY = ["", "Beginner", "Intermediate", "Advanced"];
const SYSTEMS = ["", "Linux", "Windows", "macOS", "Android", "Web", "Network", "Cross-platform"];

/* Shared look for the form. Sizes and case are set here so the editor reads the
   same under any global stylesheet. */
const LABEL = "mb-2 block text-[15px] font-semibold text-bone";
const SMALL_LABEL = "mb-1.5 block text-[14px] font-semibold text-bone-dim";
const COUNT = "mono mt-1.5 text-[13px] text-faint";
const INPUT = "field !py-2.5 !text-[16px]";
const PANEL = "rounded-sm border border-rule p-5";
const LEGEND = "px-2 text-[14px] font-semibold text-bone-dim";
const CHIP = "chip font-sans text-[14px] normal-case tracking-normal";

interface FormState {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  articleType: ArticleType;
  platform: string;
  difficulty: string;
  operatingSystem: string;
  skills: string;
  tags: string;
  toolsUsed: string;
  featured: boolean;
  status: ArticleStatus;
  seoTitle: string;
  seoDescription: string;
  sourceName: string;
  sourceUrl: string;
  isSample: boolean;
}

const EMPTY: FormState = {
  title: "",
  excerpt: "",
  content: "## Introduction\n\n",
  coverImage: "",
  category: "",
  articleType: "ctf-writeup",
  platform: "",
  difficulty: "",
  operatingSystem: "",
  skills: "",
  tags: "",
  toolsUsed: "",
  featured: false,
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  sourceName: "",
  sourceUrl: "",
  isSample: false,
};

const splitList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const TOOLBAR: Array<{ label: string; hint: string; before: string; after?: string; block?: boolean }> = [
  { label: "H2", hint: "Section heading", before: "## ", block: true },
  { label: "H3", hint: "Sub-heading", before: "### ", block: true },
  { label: "B", hint: "Bold", before: "**", after: "**" },
  { label: "I", hint: "Italic", before: "*", after: "*" },
  { label: "`code`", hint: "Inline code", before: "`", after: "`" },
  { label: "code block", hint: "Fenced code", before: "```bash\n", after: "\n```", block: true },
  { label: "link", hint: "Link", before: "[", after: "](https://)" },
  { label: "image", hint: "Image", before: "![alt text](", after: ")" },
  {
    label: "table",
    hint: "Table",
    before: "| Column | Value |\n| --- | --- |\n|  |  |\n",
    block: true,
  },
  { label: "list", hint: "Bullet list", before: "- ", block: true },
  { label: "1.", hint: "Numbered list", before: "1. ", block: true },
  { label: "quote", hint: "Blockquote", before: "> ", block: true },
  {
    label: "callout",
    hint: "Callout block",
    before: "> [!NOTE]\n> ",
    block: true,
  },
  {
    label: "collapse",
    hint: "Collapsible section",
    before: "```collapse Details\n\n\n```\n",
    block: true,
  },
];

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const bodyImageInput = useRef<HTMLInputElement>(null);

  usePageMeta({
    title: id ? "Edit article — Admin" : "New article — Admin",
    description: "Markdown publishing desk.",
  });

  useEffect(() => {
    let alive = true;
    Promise.all([articlesApi.categories(), id ? adminApi.article(id) : Promise.resolve(null)])
      .then(([categoryList, article]) => {
        if (!alive) return;
        setCategories(categoryList);
        if (article) {
          setForm({
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            coverImage: article.coverImage,
            category: article.category?._id || "",
            articleType: article.articleType,
            platform: article.platform || "",
            difficulty: article.difficulty || "",
            operatingSystem: article.operatingSystem || "",
            skills: (article.skills || []).join(", "),
            tags: (article.tags || []).join(", "),
            toolsUsed: (article.toolsUsed || []).join(", "),
            featured: article.featured,
            status: article.status,
            seoTitle: article.seoTitle || "",
            seoDescription: article.seoDescription || "",
            sourceName: article.source?.name || "",
            sourceUrl: article.source?.url || "",
            isSample: Boolean(article.isSample),
          });
        } else {
          setForm((current) => ({ ...current, category: categoryList[0]?._id || "" }));
        }
      })
      .catch((caught) => {
        if (alive) setError(errorMessage(caught));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setNotice(null);
  };

  const insert = (before: string, after = "", block = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.content.slice(start, end);
    const prefix = block && start > 0 && form.content[start - 1] !== "\n" ? "\n" : "";
    const insertion = `${prefix}${before}${selected}${after ?? ""}`;
    const next = `${form.content.slice(0, start)}${insertion}${form.content.slice(end)}`;
    update("content", next);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + insertion.length - (after ? after.length : 0);
      textarea.setSelectionRange(caret, caret);
    });
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImage(file);
      update("coverImage", result.url);
      setNotice("Cover image uploaded.");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setUploading(false);
    }
  };

  const handleBodyUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadImage(file);
      insert(`\n![${file.name.replace(/\.[^.]+$/, "")}](${result.url})\n`);
      setNotice("Screenshot inserted into the body.");
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const problems: string[] = [];
    if (form.title.trim().length < 6) problems.push("Title needs at least 6 characters.");
    if (form.excerpt.trim().length < 20) problems.push("Excerpt needs at least 20 characters.");
    if (form.content.trim().length < 80) problems.push("Content needs at least 80 characters.");
    if (!form.category) problems.push("Choose a category.");
    setFieldErrors(problems);
    return problems.length === 0;
  };

  const save = async (status: ArticleStatus) => {
    setError(null);
    setNotice(null);
    if (status === "published" && !validate()) {
      setError("Fix the highlighted fields before publishing.");
      return;
    }
    if (status === "draft" && !form.title.trim()) {
      setError("Give the draft a title first.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage,
        category: form.category,
        articleType: form.articleType,
        platform: form.platform,
        difficulty: form.difficulty,
        operatingSystem: form.operatingSystem,
        skills: splitList(form.skills),
        tags: splitList(form.tags).map((tag) => tag.toLowerCase()),
        toolsUsed: splitList(form.toolsUsed),
        featured: form.featured,
        status,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        isSample: form.isSample,
        ...(form.sourceName || form.sourceUrl
          ? { source: { name: form.sourceName, url: form.sourceUrl } }
          : { source: undefined }),
      };

      if (id) {
        const saved = await adminApi.update(id, payload);
        setForm((current) => ({ ...current, status: saved.status, content: saved.content }));
        setNotice(status === "published" ? "Changes published." : "Saved as draft.");
      } else {
        const created = await adminApi.create(payload);
        setNotice(status === "published" ? "Article published." : "Draft created.");
        navigate(`/admin/articles/${created._id}/edit`, { replace: true });
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const previewArticle = useMemo(
    () => ({
      slug: id || "preview",
      articleType: form.articleType,
      platform: form.platform,
    }),
    [id, form.articleType, form.platform],
  );

  const difficultyOptions =
    form.articleType === "tutorial" ? LEARNING_DIFFICULTY : MACHINE_DIFFICULTY;

  if (loading) return <Spinner label="Opening the editor" />;
  if (error && !form.title && !id) return <ErrorState message={error} />;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-rule pb-6">
        <div>
          <Link
            to="/admin/articles"
            className="inline-flex items-center gap-2 text-[15px] text-dim underline decoration-ghost underline-offset-4 transition-colors hover:text-bone"
          >
            <ArrowLeft size={15} /> Articles
          </Link>
          <h1 className="mt-4 font-serif text-[clamp(2rem,3.6vw,2.6rem)] leading-[1.08] font-medium tracking-[-0.02em] text-bone">
            {id ? "Edit article" : "New article"}
          </h1>
          <p className="mt-2 text-[15px] text-dim">
            Status ·{" "}
            <span
              className={`font-semibold ${form.status === "published" ? "text-ok" : "text-warn"}`}
            >
              {form.status}
            </span>
            {id && ` · /${previewArticle.slug}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => save("draft")}
            className="btn btn-ghost"
            disabled={saving}
          >
            {saving ? "Saving…" : id && form.status === "published" ? "Unpublish" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => save("published")}
            className="btn btn-primary"
            disabled={saving}
          >
            {form.status === "published" ? "Update published" : "Publish"}
          </button>
          {id && form.status === "published" && (
            <a
              href={articlePath(previewArticle as never)}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-ghost"
            >
              View <ExternalLink size={15} />
            </a>
          )}
        </div>
      </div>

      {(error || fieldErrors.length > 0) && (
        <div
          role="alert"
          className="mt-6 rounded-sm border border-l-[3px] border-rule border-l-signal bg-paper px-5 py-4"
        >
          <p className="text-[15px] font-semibold text-signal">Cannot save</p>
          <p className="mt-1.5 text-[15px] text-bone-dim">{error}</p>
          {fieldErrors.length > 0 && (
            <ul className="mt-2 list-inside list-disc text-[15px] text-bone-dim">
              {fieldErrors.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {notice && (
        <p className="mt-6 rounded-sm border border-l-[3px] border-rule border-l-ok bg-paper px-5 py-3 text-[15px] text-ok">
          {notice}
        </p>
      )}

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        {/* ── Form ────────────────────────────────────────────────────── */}
        <div className="space-y-7">
          <div>
            <label htmlFor="title" className={LABEL}>
              Title
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              maxLength={180}
              placeholder="Hack The Box — Machine name: what the box teaches"
              className={`${INPUT} !text-[18px]`}
            />
            <p className={COUNT}>{form.title.length}/180 · slug generated on first save</p>
          </div>

          <div>
            <label htmlFor="excerpt" className={LABEL}>
              Excerpt
            </label>
            <textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(event) => update("excerpt", event.target.value)}
              maxLength={400}
              rows={2}
              placeholder="One or two sentences that tell the reader what this entry establishes."
              className={`${INPUT} resize-none`}
            />
            <p className={COUNT}>{form.excerpt.length}/400</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="articleType" className={LABEL}>
                Article type
              </label>
              <select
                id="articleType"
                value={form.articleType}
                onChange={(event) => update("articleType", event.target.value as ArticleType)}
                className={INPUT}
              >
                {TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className={LABEL}>
                Category
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(event) => update("category", event.target.value)}
                className={INPUT}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(form.articleType === "ctf-writeup" || form.articleType === "tutorial") && (
            <fieldset className={PANEL}>
              <legend className={LEGEND}>Technical metadata</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                {form.articleType === "ctf-writeup" && (
                  <div>
                    <label htmlFor="platform" className={SMALL_LABEL}>
                      Platform
                    </label>
                    <select
                      id="platform"
                      value={form.platform}
                      onChange={(event) => update("platform", event.target.value)}
                      className={INPUT}
                    >
                      {PLATFORMS.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform || "—"}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="difficulty" className={SMALL_LABEL}>
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    value={form.difficulty}
                    onChange={(event) => update("difficulty", event.target.value)}
                    className={INPUT}
                  >
                    {difficultyOptions.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty || "—"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="os" className={SMALL_LABEL}>
                    Operating system
                  </label>
                  <select
                    id="os"
                    value={form.operatingSystem}
                    onChange={(event) => update("operatingSystem", event.target.value)}
                    className={INPUT}
                  >
                    {SYSTEMS.map((system) => (
                      <option key={system} value={system}>
                        {system || "—"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="skills" className={SMALL_LABEL}>
                    Skills covered
                  </label>
                  <input
                    id="skills"
                    value={form.skills}
                    onChange={(event) => update("skills", event.target.value)}
                    placeholder="Web enumeration, Command injection"
                    className={INPUT}
                  />
                </div>
              </div>
            </fieldset>
          )}

          {(form.articleType === "news" || form.articleType === "research") && (
            <fieldset className={PANEL}>
              <legend className={LEGEND}>Provenance</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="sourceName" className={SMALL_LABEL}>
                    Original source
                  </label>
                  <input
                    id="sourceName"
                    value={form.sourceName}
                    onChange={(event) => update("sourceName", event.target.value)}
                    placeholder="Vendor advisory / mailing list"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label htmlFor="sourceUrl" className={SMALL_LABEL}>
                    Source link
                  </label>
                  <input
                    id="sourceUrl"
                    type="url"
                    value={form.sourceUrl}
                    onChange={(event) => update("sourceUrl", event.target.value)}
                    placeholder="https://"
                    className={INPUT}
                  />
                </div>
              </div>
              <label className="mt-5 flex items-center gap-3 text-[15px] text-bone-dim">
                <input
                  type="checkbox"
                  checked={form.isSample}
                  onChange={(event) => update("isSample", event.target.checked)}
                  className="h-4 w-4 accent-signal"
                />
                Mark as sample content (never describe a real incident unless sourced)
              </label>
            </fieldset>
          )}

          {/* Markdown editor */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-sm border border-b-0 border-rule bg-paper-2 px-2.5 py-2">
              <div className="flex flex-wrap items-center gap-0.5">
                {TOOLBAR.map((tool) => (
                  <button
                    key={tool.label}
                    type="button"
                    title={tool.hint}
                    onClick={() => insert(tool.before, tool.after ?? "", tool.block)}
                    className="mono rounded-sm px-2.5 py-1.5 text-[13px] text-bone-dim transition-colors hover:bg-ink hover:text-bone"
                  >
                    {tool.label}
                  </button>
                ))}
                <button
                  type="button"
                  title="Upload screenshot"
                  onClick={() => bodyImageInput.current?.click()}
                  className="mono flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-[13px] text-bone-dim transition-colors hover:bg-ink hover:text-bone"
                >
                  <ImagePlus size={14} /> upload
                </button>
              </div>

              <div className="flex items-center gap-1 xl:hidden">
                {(["write", "preview"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTab(value)}
                    className={`rounded-sm px-3 py-1.5 text-[14px] capitalize ${
                      tab === value ? "bg-ink font-semibold text-bone" : "text-dim"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>

              <span className="hidden text-[14px] text-dim xl:block">
                {form.content.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={form.content}
              onChange={(event) => update("content", event.target.value)}
              spellCheck
              className={`field field-mono min-h-[560px] resize-y rounded-t-none rounded-b-sm border-t-0 !text-[14.5px] leading-[1.75] ${
                tab === "preview" ? "hidden xl:block" : ""
              }`}
              placeholder="## Executive Summary&#10;&#10;Write the entry in Markdown…"
            />

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <p className="mono text-[13px] leading-relaxed text-faint">
                Markdown · callouts with &gt; [!NOTE] · collapsible fences with ```collapse Title
              </p>
              <p className="text-[14px] text-faint">Reading time is calculated automatically</p>
            </div>
          </div>

          {/* Classification */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="tags" className={LABEL}>
                Tags (comma separated)
              </label>
              <input
                id="tags"
                value={form.tags}
                onChange={(event) => update("tags", event.target.value)}
                placeholder="linux, privesc, sudo"
                className={INPUT}
              />
              {splitList(form.tags).length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {splitList(form.tags).map((tag) => (
                    <span key={tag} className={CHIP}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="toolsUsed" className={LABEL}>
                Tools used
              </label>
              <input
                id="toolsUsed"
                value={form.toolsUsed}
                onChange={(event) => update("toolsUsed", event.target.value)}
                placeholder="nmap, Burp Suite, linpeas"
                className={INPUT}
              />
            </div>
          </div>

          {/* Cover */}
          <div className={PANEL}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold text-bone">Cover image</p>
                <p className="mt-1 text-[14px] text-dim">JPEG, PNG or WebP · maximum 4 MB.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  className="btn btn-ghost"
                  disabled={uploading}
                >
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  Upload
                </button>
                {form.coverImage && (
                  <button
                    type="button"
                    onClick={() => update("coverImage", "")}
                    className="btn btn-ghost"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <input
              ref={coverInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverUpload}
              className="hidden"
            />
            <input
              ref={bodyImageInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBodyUpload}
              className="hidden"
            />

            <input
              value={form.coverImage}
              onChange={(event) => update("coverImage", event.target.value)}
              placeholder="/covers/example.svg or https://…"
              aria-label="Cover image path"
              className={`${INPUT} mt-4`}
            />

            {form.coverImage && (
              <img
                src={assetUrl(form.coverImage)}
                alt="Cover preview"
                className="mt-4 aspect-[16/9] w-full rounded-sm border border-rule object-cover"
              />
            )}
          </div>

          {/* SEO + flags */}
          <div className={PANEL}>
            <p className="text-[15px] font-semibold text-bone">SEO metadata</p>
            <div className="mt-4 grid gap-5">
              <div>
                <label htmlFor="seoTitle" className={SMALL_LABEL}>
                  SEO title
                </label>
                <input
                  id="seoTitle"
                  value={form.seoTitle}
                  onChange={(event) => update("seoTitle", event.target.value)}
                  maxLength={70}
                  className={INPUT}
                  placeholder="Defaults to the article title"
                />
                <p className={COUNT}>{form.seoTitle.length}/70</p>
              </div>
              <div>
                <label htmlFor="seoDescription" className={SMALL_LABEL}>
                  Meta description
                </label>
                <textarea
                  id="seoDescription"
                  value={form.seoDescription}
                  onChange={(event) => update("seoDescription", event.target.value)}
                  maxLength={170}
                  rows={2}
                  className={`${INPUT} resize-none`}
                  placeholder="Defaults to the excerpt"
                />
                <p className={COUNT}>{form.seoDescription.length}/170</p>
              </div>
            </div>

            <label className="mt-5 flex items-center gap-3 border-t border-rule pt-5 text-[15px] text-bone-dim">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => update("featured", event.target.checked)}
                className="h-4 w-4 accent-signal"
              />
              Feature on the homepage (replaces the current featured entry)
            </label>
          </div>
        </div>

        {/* ── Preview ─────────────────────────────────────────────────── */}
        <aside className={`${tab === "write" ? "hidden xl:block" : ""}`}>
          <div className="sticky top-6">
            <div className="flex items-center justify-between rounded-t-sm border border-b-0 border-rule bg-paper-2 px-4 py-2.5">
              <span className="text-[15px] font-semibold text-bone">Live preview</span>
              <span className="text-[14px] text-dim">{TYPE_LABELS[form.articleType]}</span>
            </div>

            <div className="preview-frame max-h-[calc(100vh-8rem)] overflow-y-auto rounded-t-none">
              <div className="flex flex-wrap items-center gap-2.5 text-[14px]">
                <span className="font-semibold text-signal">
                  {form.platform || TYPE_LABELS[form.articleType]}
                </span>
                {form.difficulty && (
                  <>
                    <span className="text-ghost">/</span>
                    <span className="text-dim">{form.difficulty}</span>
                  </>
                )}
                {form.isSample && (
                  <span className="rounded-sm border border-warn/40 px-2 py-0.5 text-[12px] font-medium text-warn">
                    Sample
                  </span>
                )}
              </div>

              <h2 className="balance mt-3 font-serif text-[30px] leading-[1.1] font-medium tracking-[-0.02em] text-bone">
                {form.title || "Untitled entry"}
              </h2>

              <p className="mt-4 text-[16px] leading-relaxed text-bone-dim">
                {form.excerpt || "The excerpt appears here, under the title."}
              </p>

              {form.coverImage && (
                <img
                  src={assetUrl(form.coverImage)}
                  alt=""
                  className="mt-5 aspect-[16/9] w-full rounded-sm border border-rule object-cover"
                />
              )}

              <div className="mt-7 border-t border-rule pt-6">
                <MarkdownContent content={form.content} compact />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}