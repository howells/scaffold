/**
 * sync-skill.ts
 *
 * Generates `skills/scaffold/references/` from `docs/`, replacing the previously
 * hand-maintained duplicate tree. All docs edits happen once in `docs/` and are
 * propagated into the packaged agent skill by running this script.
 *
 * Run with Node 24's native TypeScript type-stripping:
 *   node scripts/sync-skill.ts          # write mode (regenerate the skill tree)
 *   node scripts/sync-skill.ts --check  # verify the skill tree is in sync; exit 1 on drift
 *
 * No dependencies. `node:fs` / `node:path` only. Fail-fast: unexpected tree
 * shapes throw rather than being silently skipped.
 *
 * Transform contract (matched byte-for-byte against the committed skill tree):
 *
 *   Strip pass  — `docs/getting-started.md` and `docs/reference/*.md`
 *                 (non-recursive, `.md` only, excluding the `ui-baseline/`
 *                 directory), plus the `ui-baseline/README.md` landing page.
 *                 Removes the leading YAML frontmatter block and the single
 *                 blank line after it. Never synthesises an H1 (every page
 *                 already carries a body H1); a guarded fallback inserts one
 *                 only if a stripped body does not already start with "# ".
 *
 *   Link flatten — in `docs/getting-started.md` only (it lives one level above
 *                 `reference/`), the literal substring `./reference/` becomes
 *                 `./`. Sibling links inside `reference/*.md` are already flat
 *                 and are left untouched (`./ui-baseline/README.md` passes
 *                 through unchanged).
 *
 *   Verbatim pass — everything under `docs/reference/ui-baseline/source/**` is
 *                 copied byte-identically (including `.mdx` files with their
 *                 vendored frontmatter and the vendored fumadocs `meta.json`
 *                 inside that snapshot). The fumadocs navigation `meta.json`
 *                 that sits directly at the `ui-baseline/` root is dropped.
 */

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
// The skill tree flattens `docs/reference/` away, so ui-baseline lands directly
// under the references root.
const UI_BASELINE_OUT = "ui-baseline";

/** Remove the leading YAML frontmatter block and the single blank line after it. */
function stripFrontmatter(text: string, sourceLabel: string): string {
  if (!text.startsWith("---\n")) {
    throw new Error(
      `Expected leading YAML frontmatter (\`---\`) in ${sourceLabel}, ` +
        `but the file does not start with one.`,
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
  // Remove the single blank line that separates frontmatter from the body.
  if (lines[bodyStart] === "") {
    bodyStart += 1;
  }

  let body = lines.slice(bodyStart).join("\n");

  // Guarded fallback: only synthesise an H1 if the body lacks one. Every current
  // page already has a body H1, so this never fires in practice — synthesising
  // unconditionally would recreate the duplicate-heading bug fixed in b9ce174.
  if (!body.startsWith("# ")) {
    const frontmatter = lines.slice(1, closingIndex);
    const titleLine = frontmatter.find((line) => /^title:\s*/.test(line));
    if (!titleLine) {
      throw new Error(
        `${sourceLabel}: stripped body has no H1 and frontmatter has no \`title\` to synthesise one from.`,
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

/** In `getting-started.md`, flatten `./reference/` links (it sits above `reference/`). */
function flattenReferenceLinks(text: string): string {
  return text.split("./reference/").join("./");
}

/** List `.md` files directly inside a directory (non-recursive), sorted. */
function listFlatMarkdown(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .filter((name) => statSync(join(dir, name)).isFile())
    .sort();
}

/** Recursively list files under a directory as paths relative to it, sorted. */
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

/**
 * Build the complete desired skill-reference tree in memory as a map of
 * output-relative path -> file bytes. This is the single source of truth for
 * both write and --check modes.
 */
function generate(): Map<string, Buffer> {
  const tree = new Map<string, Buffer>();

  const add = (relPath: string, content: Buffer): void => {
    if (tree.has(relPath)) {
      throw new Error(`Two passes produced the same output path: ${relPath}`);
    }
    tree.set(relPath, content);
  };

  // --- Strip pass: getting-started.md (with link flatten) ---
  {
    const src = join(DOCS, "getting-started.md");
    const stripped = stripFrontmatter(readFileSync(src, "utf8"), "docs/getting-started.md");
    add("getting-started.md", Buffer.from(flattenReferenceLinks(stripped), "utf8"));
  }

  // --- Strip pass: docs/reference/*.md (non-recursive, excludes ui-baseline/) ---
  for (const name of listFlatMarkdown(join(DOCS, "reference"))) {
    const src = join(DOCS, "reference", name);
    const stripped = stripFrontmatter(readFileSync(src, "utf8"), `docs/reference/${name}`);
    add(name, Buffer.from(stripped, "utf8"));
  }

  // --- ui-baseline pass ---
  // README.md landing page is a docs page (frontmatter stripped); the fumadocs
  // nav meta.json at the ui-baseline root is dropped; everything under source/
  // is copied verbatim (including its vendored frontmatter and meta.json).
  for (const rel of walk(UI_BASELINE_SRC)) {
    const segments = rel.split(/[/\\]/);
    const outRel = join(UI_BASELINE_OUT, rel);
    const abs = join(UI_BASELINE_SRC, rel);

    if (segments.length === 1) {
      if (rel === "README.md") {
        const stripped = stripFrontmatter(
          readFileSync(abs, "utf8"),
          "docs/reference/ui-baseline/README.md",
        );
        add(outRel, Buffer.from(stripped, "utf8"));
      } else if (rel === "meta.json") {
        // Fumadocs navigation for this repo's docs site — not skill content.
        continue;
      } else {
        throw new Error(
          `Unexpected file at ui-baseline root: ${rel}. ` +
            `Expected only README.md, meta.json, and source/.`,
        );
      }
      continue;
    }

    if (segments[0] === "source") {
      add(outRel, readFileSync(abs)); // verbatim bytes
      continue;
    }

    throw new Error(
      `Unexpected path under ui-baseline: ${rel}. ` +
        `Expected files under source/ only (plus root README.md / meta.json).`,
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

  // Remove files that no longer correspond to any generated output.
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
