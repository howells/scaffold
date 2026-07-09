/**
 * generate-principles.ts
 *
 * Generates `docs/principles.md` from the single source of truth in
 * `src/content/principles.ts`. The homepage renders the same module directly,
 * so the two surfaces cannot drift.
 *
 *   node scripts/generate-principles.ts          # write docs/principles.md
 *   node scripts/generate-principles.ts --check  # verify it is in sync; exit 1 on drift
 *
 * No dependencies beyond node:fs. The principles module is imported at runtime
 * (Node 24 type-stripping) via a file URL so `tsc` does not resolve it here.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPT_DIR, "..");
const OUT = join(ROOT, "docs", "principles.md");
const SOURCE = join(ROOT, "src", "content", "principles.ts");

interface Principle {
  readonly title: string;
  readonly summary: string;
  readonly body: string;
}
interface PrincipleGroup {
  readonly group: string;
  readonly principles: readonly Principle[];
}
interface PrinciplesModule {
  readonly principlesMeta: { readonly title: string; readonly description: string };
  readonly principlesIntro: readonly string[];
  readonly principleGroups: readonly PrincipleGroup[];
}

async function loadModule(): Promise<PrinciplesModule> {
  return (await import(pathToFileURL(SOURCE).href)) as PrinciplesModule;
}

function render(mod: PrinciplesModule): string {
  const { principlesMeta, principlesIntro, principleGroups } = mod;
  const parts: string[] = [
    `---\ntitle: "${principlesMeta.title}"\ndescription: "${principlesMeta.description}"\n---`,
    `# ${principlesMeta.title}`,
    ...principlesIntro,
  ];

  for (const group of principleGroups) {
    parts.push(`## ${group.group}`);
    for (const principle of group.principles) {
      parts.push(`### ${principle.title}`);
      parts.push(principle.body);
    }
  }

  return `${parts.join("\n\n")}\n`;
}

async function main(): Promise<void> {
  const check = process.argv.slice(2).includes("--check");
  const generated = render(await loadModule());

  if (check) {
    const existing = readFileSync(OUT, "utf8");
    if (existing !== generated) {
      console.error(
        "docs/principles.md is out of sync with src/content/principles.ts.\n" +
          "Run `pnpm generate:principles` to regenerate.",
      );
      process.exit(1);
    }
    console.log("docs/principles.md is in sync with src/content/principles.ts.");
    return;
  }

  writeFileSync(OUT, generated);
  console.log("Generated docs/principles.md from src/content/principles.ts.");
}

await main();
