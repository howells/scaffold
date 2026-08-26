// Root docs and reference docs lose frontmatter. UI baseline sources are copied
// byte-for-byte. Root-doc links are flattened to match the generated tree.

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

const SCRIPT_DIR = import.meta.dirname;
const ROOT = join(SCRIPT_DIR, "..");
const DOCS = join(ROOT, "docs");
const OUT = join(ROOT, "skills", "scaffold", "references");

const UI_BASELINE_SRC = join(DOCS, "reference", "ui-baseline");
const UI_BASELINE_OUT = "ui-baseline";

function stripFrontmatter(text: string, sourceLabel: string): string {
  if (!text.startsWith("---\n")) {
    throw new Error(
      `Expected leading YAML frontmatter (\`---\`) in ${sourceLabel}, ` +
        `but the file does not start with one.`
    );
  }

  const lines = text.split("\n");
  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") {
      closingIndex = i;
      break;
    }
  }
  if (closingIndex === -1) {
    throw new Error(`Unterminated YAML frontmatter in ${sourceLabel}.`);
  }

  let bodyStart = closingIndex + 1;
  if (lines[bodyStart] === "") {
    bodyStart += 1;
  }

  let body = lines.slice(bodyStart).join("\n");

  if (!body.startsWith("# ")) {
    const frontmatter = lines.slice(1, closingIndex);
    const titleLine = frontmatter.find((line) => /^title:\s*/.test(line));
    if (!titleLine) {
      throw new Error(
        `${sourceLabel}: stripped body has no H1 and frontmatter has no \`title\` to synthesise one from.`
      );
    }
    const title = titleLine
      .replace(/^title:\s*/, "")
      .trim()
      .replace(/^["']|["']$/g, "");
    body = `# ${title}\n\n${body}`;
  }

  return body;
}

function flattenReferenceLinks(text: string): string {
  return text.split("./reference/").join("./");
}

function listFlatMarkdown(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .filter((name) => statSync(join(dir, name)).isFile())
    .sort();
}

function walk(dir: string): string[] {
  const out: string[] = [];
  const recurse = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        recurse(full);
      } else if (entry.isFile()) {
        out.push(relative(dir, full));
      } else {
        throw new Error(`Unexpected non-file, non-directory entry: ${full}`);
      }
    }
  };
  recurse(dir);
  return out.sort();
}

function generate(): Map<string, Buffer> {
  const tree = new Map<string, Buffer>();

  const add = (relPath: string, content: Buffer): void => {
    if (tree.has(relPath)) {
      throw new Error(`Two passes produced the same output path: ${relPath}`);
    }
    tree.set(relPath, content);
  };

  for (const name of listFlatMarkdown(DOCS)) {
    if (name === "README.md") {
      continue;
    }
    const src = join(DOCS, name);
    const stripped = stripFrontmatter(
      readFileSync(src, "utf8"),
      `docs/${name}`
    );
    add(name, Buffer.from(flattenReferenceLinks(stripped), "utf8"));
  }

  for (const name of listFlatMarkdown(join(DOCS, "reference"))) {
    const src = join(DOCS, "reference", name);
    const stripped = stripFrontmatter(
      readFileSync(src, "utf8"),
      `docs/reference/${name}`
    );
    add(name, Buffer.from(stripped, "utf8"));
  }

  for (const rel of walk(UI_BASELINE_SRC)) {
    const segments = rel.split(/[/\\]/);
    const outRel = join(UI_BASELINE_OUT, rel);
    const abs = join(UI_BASELINE_SRC, rel);

    if (segments.length === 1) {
      if (rel === "README.md") {
        const stripped = stripFrontmatter(
          readFileSync(abs, "utf8"),
          "docs/reference/ui-baseline/README.md"
        );
        add(outRel, Buffer.from(stripped, "utf8"));
      } else if (rel === "meta.json") {
        continue;
      } else {
        throw new Error(
          `Unexpected file at ui-baseline root: ${rel}. ` +
            `Expected only README.md, meta.json, and source/.`
        );
      }
      continue;
    }

    if (segments[0] === "source") {
      add(outRel, readFileSync(abs));
      continue;
    }

    throw new Error(
      `Unexpected path under ui-baseline: ${rel}. ` +
        `Expected files under source/ only (plus root README.md / meta.json).`
    );
  }

  return tree;
}

function checkMode(tree: Map<string, Buffer>): number {
  const existing = existsSync(OUT) ? new Set(walk(OUT)) : new Set<string>();
  const drift: string[] = [];

  for (const [rel, content] of tree) {
    const abs = join(OUT, rel);
    if (!existsSync(abs)) {
      drift.push(`missing:  ${rel}`);
    } else if (!readFileSync(abs).equals(content)) {
      drift.push(`changed:  ${rel}`);
    }
    existing.delete(rel);
  }
  for (const rel of [...existing].sort()) {
    drift.push(`stale:    ${rel}`);
  }

  if (drift.length > 0) {
    console.error("skills/scaffold/references/ is out of sync with docs/:");
    for (const line of drift.sort()) {
      console.error(`  ${line}`);
    }
    console.error("\nRun `pnpm sync:skill` to regenerate.");
    return 1;
  }

  console.log("skills/scaffold/references/ is in sync with docs/.");
  return 0;
}

function pruneEmptyDirs(dir: string): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      pruneEmptyDirs(join(dir, entry.name));
    }
  }
  if (dir !== OUT && readdirSync(dir).length === 0) {
    rmdirSync(dir);
  }
}

function writeMode(tree: Map<string, Buffer>): number {
  const existing = existsSync(OUT) ? new Set(walk(OUT)) : new Set<string>();

  for (const [rel, content] of tree) {
    const abs = join(OUT, rel);
    if (!existsSync(abs) || !readFileSync(abs).equals(content)) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
    }
    existing.delete(rel);
  }

  for (const rel of existing) {
    rmSync(join(OUT, rel));
  }
  if (existsSync(OUT)) {
    pruneEmptyDirs(OUT);
  }

  console.log(`Synced ${tree.size} file(s) into skills/scaffold/references/.`);
  return 0;
}

function main(): void {
  const check = process.argv.slice(2).includes("--check");
  const tree = generate();
  const code = check ? checkMode(tree) : writeMode(tree);
  process.exit(code);
}

main();
