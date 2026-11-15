export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export function headingId(text: string) {
  return text
    .toLowerCase()
    .replace(/`|\*|_/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Converts GitHub-style callouts (`> [!NOTE]`) into fenced blocks the renderer
 * can style, without enabling raw HTML in article bodies.
 */
export function transformCallouts(markdown: string) {
  const lines = markdown.split("\n");
  const output: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*$/i);

    if (!match) {
      output.push(line);
      continue;
    }

    const kind = match[1].toLowerCase() === "caution" ? "warning" : match[1].toLowerCase();
    const body: string[] = [];
    let cursor = index + 1;

    while (cursor < lines.length && /^>/.test(lines[cursor])) {
      body.push(lines[cursor].replace(/^>\s?/, ""));
      cursor += 1;
    }

    output.push(`\`\`\`callout-${kind}`);
    output.push(body.join("\n").trim());
    output.push("```");
    index = cursor - 1;
  }

  return output.join("\n");
}

export interface Segment {
  type: "markdown" | "collapse";
  content: string;
  title?: string;
}

/** Splits ```` ```collapse Title ```` blocks into segments the renderer stacks. */
export function splitCollapse(markdown: string): Segment[] {
  const lines = markdown.split("\n");
  const segments: Segment[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length) {
      segments.push({ type: "markdown", content: buffer.join("\n") });
      buffer = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const opening = lines[index].match(/^```collapse(?:\s+(.*))?$/);
    if (!opening) {
      buffer.push(lines[index]);
      continue;
    }

    const body: string[] = [];
    let cursor = index + 1;
    while (cursor < lines.length && !/^```\s*$/.test(lines[cursor])) {
      body.push(lines[cursor]);
      cursor += 1;
    }

    flush();
    segments.push({
      type: "collapse",
      title: opening[1]?.trim() || "Expand",
      content: body.join("\n"),
    });
    index = cursor;
  }

  flush();
  return segments;
}

/** Builds the table of contents from level-2 and level-3 headings. */
export function extractToc(markdown: string): TocEntry[] {
  const lines = markdown.split("\n");
  const entries: TocEntry[] = [];
  let insideFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence) continue;

    const match = line.match(/^(##|###)\s+(.+?)\s*$/);
    if (!match) continue;

    const text = match[2].replace(/[*_`]/g, "").trim();
    entries.push({ id: headingId(text), text, level: match[1].length === 2 ? 2 : 3 });
  }

  return entries;
}

/** Rough reading progress through the supplied element. */
export function readingTimeLabel(minutes: number) {
  return `${minutes} min read`;
}
