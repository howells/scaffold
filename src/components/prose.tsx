import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renders the constrained Markdown subset used in principle bodies —
 * paragraphs, inline `code`, and `[text](url)` links — as React. Server
 * component; no dependency. The bodies are authored in
 * `src/content/principles.ts`, so the accepted syntax is deliberately narrow.
 */

const INLINE = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;

const linkClass =
  "text-fd-foreground underline decoration-[var(--sc-border)] underline-offset-2 transition-colors hover:decoration-[var(--sc-accent)]";

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    const [full, code, linkText, url] = match;
    if (code != null) {
      nodes.push(
        <code
          className="rounded bg-[var(--sc-surface-soft)] px-1 py-0.5 font-mono text-[0.8125rem] text-fd-foreground"
          key={key}
        >
          {code}
        </code>
      );
    } else if (linkText != null && url != null) {
      nodes.push(
        url.startsWith("/") ? (
          <Link className={linkClass} href={url} key={key}>
            {linkText}
          </Link>
        ) : (
          <a
            className={linkClass}
            href={url}
            key={key}
            rel="noreferrer"
            target="_blank"
          >
            {linkText}
          </a>
        )
      );
    }

    lastIndex = index + full.length;
    key += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export function Prose({ body }: { readonly body: string }) {
  return (
    <div className="mt-2 flex max-w-[68ch] flex-col gap-3">
      {body.split("\n\n").map((paragraph) => (
        <p
          className="text-sm leading-[1.7] text-fd-muted-foreground"
          key={paragraph.slice(0, 40)}
        >
          {renderInline(paragraph)}
        </p>
      ))}
    </div>
  );
}
