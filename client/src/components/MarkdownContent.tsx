import { useEffect, useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-json";
import "prismjs/components/prism-http";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-go";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-powershell";
import "prismjs/components/prism-diff";
import "prismjs/components/prism-docker";
import { Check, Copy, Info, Lightbulb, TriangleAlert, X } from "lucide-react";
import { headingId, splitCollapse, transformCallouts } from "../lib/markdown";
import { assetUrl } from "../services/api";

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  yml: "yaml",
  html: "markup",
  xml: "markup",
  text: "none",
  plain: "none",
  plaintext: "none",
  output: "none",
  markdown: "markup",
  ps: "powershell",
  pwsh: "powershell",
  cs: "csharp",
  "c#": "csharp",
  dockerfile: "docker",
};

const LANGUAGE_LABELS: Record<string, string> = {
  bash: "bash",
  sql: "sql",
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  json: "json",
  http: "http",
  yaml: "yaml",
  markup: "html",
  none: "output",
  go: "go",
  csharp: "c#",
  powershell: "powershell",
  diff: "diff",
  docker: "docker",
};

function normalizeLanguage(raw?: string) {
  const value = (raw || "").toLowerCase();
  return LANGUAGE_ALIASES[value] || value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (typeof node === "object" && "props" in (node as { props?: { children?: ReactNode } })) {
    return nodeText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className="code-copy gap-1.5 text-[13px] tracking-normal normal-case"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      aria-label={copied ? "Copied" : "Copy command"}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const lang = normalizeLanguage(language);
  const highlighted = useMemo(() => {
    const grammar = Prism.languages[lang];
    if (!grammar) return escapeHtml(code);
    return Prism.highlight(code, grammar, lang);
  }, [code, lang]);

  return (
    <div className="code-block">
      <div className="code-head">
        <span className="code-lang text-[13px] tracking-normal normal-case">
          {LANGUAGE_LABELS[lang] || lang || "shell"}
        </span>
        <CopyButton text={code} />
      </div>
      <pre tabIndex={0}>
        <code
          className={`language-${lang}`}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}

const CALLOUT_META = {
  note: { label: "Note", Icon: Info },
  tip: { label: "Note to self", Icon: Lightbulb },
  warning: { label: "Warning", Icon: TriangleAlert },
  important: { label: "Important", Icon: TriangleAlert },
} as const;

type CalloutKind = keyof typeof CALLOUT_META;

function Callout({ kind, children }: { kind: CalloutKind; children: ReactNode }) {
  const { label, Icon } = CALLOUT_META[kind] ?? CALLOUT_META.note;
  return (
    <aside className={`callout callout-${kind}`}>
      <div className="callout-head gap-2 font-sans text-[15px] font-semibold tracking-normal normal-case">
        <Icon size={16} />
        {label}
      </div>
      <div className="callout-body">{children}</div>
    </aside>
  );
}

function ZoomableImage({ src, alt }: { src?: string; alt?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!src) return null;
  const resolved = assetUrl(src);

  return (
    <>
      <button
        type="button"
        className="group relative my-8 block w-full cursor-zoom-in overflow-hidden rounded-sm border border-rule bg-paper"
        onClick={() => setOpen(true)}
        aria-label={`Enlarge image: ${alt || "screenshot"}`}
      >
        <img src={resolved} alt={alt || ""} loading="lazy" className="w-full" />
        <span className="absolute right-3 bottom-3 rounded-sm bg-ink/90 px-2.5 py-1 text-[13px] font-medium text-bone-dim opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          Zoom
        </span>
      </button>

      {open && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Enlarged image"}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            className="absolute top-5 right-5 flex items-center gap-2 rounded-sm border border-white/20 px-3.5 py-2 text-[15px] text-white/80 transition-colors hover:border-white/50 hover:text-white"
            onClick={() => setOpen(false)}
          >
            Close <X size={16} />
          </button>
          <img src={resolved} alt={alt || ""} />
        </div>
      )}
    </>
  );
}

function MarkdownLayer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        pre: ({ children }) => <>{children}</>,
        code: ({ className, children }) => {
          const language = /language-([\w-]+)/.exec(className || "")?.[1] ?? "";
          const value = String(children ?? "").replace(/\n$/, "");

          if (language.startsWith("callout-")) {
            const kind = language.replace("callout-", "") as CalloutKind;
            return (
              <Callout kind={CALLOUT_META[kind] ? kind : "note"}>
                <MarkdownLayer content={value} />
              </Callout>
            );
          }

          if (language || value.includes("\n")) {
            return <CodeBlock code={value} language={language} />;
          }

          return <code>{children}</code>;
        },
        h2: ({ children }) => <h2 id={headingId(nodeText(children))}>{children}</h2>,
        h3: ({ children }) => <h3 id={headingId(nodeText(children))}>{children}</h3>,
        a: ({ href, children }) => {
          const external = Boolean(href?.startsWith("http"));
          return (
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
            >
              {children}
            </a>
          );
        },
        img: ({ src, alt }) => <ZoomableImage src={src} alt={alt} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function MarkdownContent({
  content,
  className = "",
  compact = false,
}: {
  content: string;
  className?: string;
  compact?: boolean;
}) {
  const processed = useMemo(() => transformCallouts(content || ""), [content]);
  const segments = useMemo(() => splitCollapse(processed), [processed]);

  return (
    <div
      className={`prose-journal ${compact ? "text-[15px] [&_h2]:mt-8 [&_h2]:text-xl" : ""} ${className}`}
    >
      {segments.map((segment, index) =>
        segment.type === "collapse" ? (
          <details className="collapse" key={`collapse-${index}`}>
            <summary>{segment.title}</summary>
            <div className="collapse-body">
              <MarkdownLayer content={segment.content} />
            </div>
          </details>
        ) : (
          <MarkdownLayer key={`md-${index}`} content={segment.content} />
        ),
      )}
    </div>
  );
}