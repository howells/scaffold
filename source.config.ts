import { defineConfig, defineDocs } from "fumadocs-mdx/config";

import { remarkMdLinks } from "@/lib/remark-md-links";

const markdownFiles = [
  "README.md",
  "principles.md",
  "getting-started.md",
  "adr/*.md",
  "reference/*.md",
  "reference/ui-baseline/README.md",
];

const metaFiles = [
  "meta.json",
  "adr/meta.json",
  "reference/meta.json",
  "reference/ui-baseline/meta.json",
];

const TITLE_PATTERN = /^#\s+(?<title>.+)$/mu;

const titleFromSource = (source: string): string => {
  return TITLE_PATTERN.exec(source)?.groups?.title ?? "Untitled";
};

const descriptionFromSource = (source: string): string | undefined => {
  const paragraph = source
    .split(/\n{2,}/u)
    .map((block) => block.trim())
    .find(
      (block) =>
        block.length > 0 && !block.startsWith("#") && !block.startsWith("```")
    );

  return paragraph?.replaceAll(/\s+/gu, " ");
};

export const docs = defineDocs({
  dir: "docs",
  docs: {
    files: markdownFiles,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    files: metaFiles,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: (plugins) => [...plugins, remarkMdLinks],
  },
  plugins: [
    {
      name: "scaffold-doc-frontmatter",
      doc: {
        frontmatter(data) {
          return {
            ...data,
            description:
              typeof data.description === "string"
                ? data.description
                : descriptionFromSource(this.source),
            title:
              typeof data.title === "string"
                ? data.title
                : titleFromSource(this.source),
          };
        },
      },
    },
  ],
});
