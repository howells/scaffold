import path from "node:path";

import { docPathToSlug } from "@/lib/doc-slug";

interface LinkNode {
  readonly type?: string;
  url?: string;
  readonly children?: readonly unknown[];
}

interface RemarkVFile {
  readonly path?: string;
  readonly cwd?: string;
}

const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/iu;

const isRelativeMdLink = (url: string): boolean => {
  if (SCHEME_PATTERN.test(url) || url.startsWith("/") || url.startsWith("#")) {
    return false;
  }

  const hashIndex = url.indexOf("#");
  const target = hashIndex === -1 ? url : url.slice(0, hashIndex);

  return target.endsWith(".md");
};

const visitLinks = (node: unknown, visitor: (link: LinkNode) => void): void => {
  if (typeof node !== "object" || node === null) {
    return;
  }

  const candidate = node as LinkNode;

  if (candidate.type === "link") {
    visitor(candidate);
  }

  if (Array.isArray(candidate.children)) {
    for (const child of candidate.children) {
      visitLinks(child, visitor);
    }
  }
};

export const remarkMdLinks =
  () =>
  (tree: unknown, file: RemarkVFile): void => {
    if (!file.path) {
      return;
    }

    const docsRoot = path.join(file.cwd ?? process.cwd(), "docs");
    const relativeFilePath = path
      .relative(docsRoot, file.path)
      .split(path.sep)
      .join("/");
    const fileDir = path.posix.dirname(relativeFilePath);

    visitLinks(tree, (link) => {
      const url = link.url;

      if (typeof url !== "string" || !isRelativeMdLink(url)) {
        return;
      }

      const hashIndex = url.indexOf("#");
      const target = hashIndex === -1 ? url : url.slice(0, hashIndex);
      const fragment = hashIndex === -1 ? "" : url.slice(hashIndex);
      const resolved = path.posix.normalize(path.posix.join(fileDir, target));

      link.url = `/docs/${docPathToSlug(resolved).join("/")}${fragment}`;
    });
  };
