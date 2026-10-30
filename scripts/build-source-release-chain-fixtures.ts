import {
  readdirSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import nodePath from "node:path";
import type { TestContext } from "node:test";

import { z } from "zod";

import { jsonValue } from "./build-source-fixtures.ts";
import { releaseFixture } from "./build-source-publish-fixtures.ts";

export const chainFixture = (t: TestContext) => {
  const f = releaseFixture(t);
  const root = nodePath.dirname(import.meta.dirname);
  const { scripts } = z
    .object({ scripts: z.record(z.string(), z.string()) })
    .parse(
      jsonValue(readFileSync(nodePath.join(root, "package.json"), "utf-8"))
    );
  mkdirSync(nodePath.join(f.repo, "scripts"));
  mkdirSync(nodePath.join(f.repo, "src", "lib"), { recursive: true });
  mkdirSync(nodePath.join(f.repo, "node_modules"));
  for (const name of readdirSync(import.meta.dirname).filter(
    (file) => file.startsWith("build-source") && file.endsWith(".ts")
  )) {
    writeFileSync(
      nodePath.join(f.repo, "scripts", name),
      readFileSync(nodePath.join(import.meta.dirname, name))
    );
  }
  for (const name of [
    "stamp-build.mjs",
    "check-vercel-prebuilt.mjs",
    "publish-vercel-prebuilt.mjs",
  ]) {
    writeFileSync(
      nodePath.join(f.repo, "scripts", name),
      readFileSync(nodePath.join(import.meta.dirname, name))
    );
  }
  symlinkSync(
    nodePath.join(root, "node_modules", "zod"),
    nodePath.join(f.repo, "node_modules", "zod")
  );
  writeFileSync(
    nodePath.join(f.repo, ".gitignore"),
    ".source/\n.vercel/\nnode_modules/\n"
  );
  writeFileSync(
    nodePath.join(f.repo, ".npmrc"),
    "verify-deps-before-run=false\n"
  );
  writeFileSync(
    nodePath.join(f.repo, "pnpm-workspace.yaml"),
    "packages: []\nverifyDepsBeforeRun: false\n"
  );
  writeFileSync(
    nodePath.join(f.repo, ".vercel", "project.json"),
    '{"projectId":"fixture-project"}\n'
  );
  writeFileSync(
    nodePath.join(f.repo, "scripts", "fixture-generate.mjs"),
    `import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync(".source", { recursive: true });
writeFileSync(".source/input.js", "generated before capture\\n");
`
  );
  writeFileSync(
    nodePath.join(f.repo, "scripts", "fixture-build.mjs"),
    `import { readFileSync, writeFileSync } from "node:fs";
const generated = readFileSync(".source/input.js", "utf-8");
const stamp = readFileSync("src/lib/build-info.generated.ts", "utf-8");
writeFileSync(".vercel/output/functions/index.func/index.js", generated + stamp);
`
  );
  writeFileSync(
    nodePath.join(f.repo, "package.json"),
    JSON.stringify({
      packageManager: "pnpm@11.10.0",
      private: true,
      scripts: {
        ...scripts,
        "deploy:prod:build": "node scripts/fixture-build.mjs",
        "generate:source": "node scripts/fixture-generate.mjs",
      },
      type: "module",
    })
  );
  return f;
};
