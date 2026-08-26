import Link from "next/link";
import type { ReactNode } from "react";

const INLINE = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;

const linkClass =
  "text-fd-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-ring";

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
          className="bg-muted text-fd-foreground rounded px-1 py-0.5 font-mono text-[0.8125rem]"
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
          className="text-fd-muted-foreground text-sm leading-[1.7]"
          key={paragraph.slice(0, 40)}
        >
          {renderInline(paragraph)}
        </p>
      ))}
    </div>
  );
}
