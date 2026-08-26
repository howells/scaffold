import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const docsRoot = join(root, "docs");

function filesBelow(directory: string, extension: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? filesBelow(path, extension)
      : entry.name.endsWith(extension)
        ? [path]
        : [];
  });
}

function markdownTargetExists(source: string, rawTarget: string): boolean {
  const target = decodeURIComponent(
    rawTarget.split("#", 1)[0]?.split("?", 1)[0] ?? ""
  );
  if (
    target.length === 0 ||
    target.startsWith("/") ||
    target.startsWith("#") ||
    /^[a-z][a-z+.-]*:/i.test(target)
  ) {
    return true;
  }

  const absolute = resolve(dirname(source), target);
  if (!absolute.startsWith(`${root}/`)) {
    return false;
  }
  if (existsSync(absolute)) {
    return true;
  }
  return extname(absolute) === "" && existsSync(`${absolute}.md`);
}

const failures: string[] = [];
const markdownFiles = [
  ...filesBelow(docsRoot, ".md"),
  ...filesBelow(docsRoot, ".mdx"),
];
const markdownLink = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

for (const file of markdownFiles) {
  const body = readFileSync(file, "utf8");
  for (const match of body.matchAll(markdownLink)) {
    const target = match[1];
    if (target != null && !markdownTargetExists(file, target)) {
      failures.push(`${relative(root, file)}: missing link target ${target}`);
    }
  }
}

for (const metaPath of filesBelow(docsRoot, "meta.json")) {
  const meta = JSON.parse(readFileSync(metaPath, "utf8")) as {
    pages?: readonly string[];
  };
  for (const page of meta.pages ?? []) {
    const directory = dirname(metaPath);
    const markdown = join(directory, `${page}.md`);
    const mdx = join(directory, `${page}.mdx`);
    const nested = join(directory, page);
    if (
      !existsSync(markdown) &&
      !existsSync(mdx) &&
      !(existsSync(nested) && statSync(nested).isDirectory())
    ) {
      failures.push(`${relative(root, metaPath)}: missing page ${page}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Docs integrity: ${markdownFiles.length} Markdown files and all navigation entries are valid.`
  );
}
