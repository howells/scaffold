import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import nodePath from "node:path";
import { test } from "node:test";
import { gunzipSync } from "node:zlib";

import { z } from "zod";

import {
  archiveFixture,
  command,
  fixture,
  jsonValue,
  receiptSchema,
  run,
  runWithEnv,
  succeeds,
} from "./build-source-fixtures.ts";

await test("clean source can be restored after the original checkout is lost", (t) => {
  const f = fixture(t);
  const baseCommit = f.git("rev-parse", "HEAD");
  const receipt = succeeds(
    run("capture", "--repo", f.repo, "--archive", f.archive)
  );
  rmSync(f.repo, { recursive: true });
  const restored = succeeds(
    run(
      "restore",
      "--archive",
      f.archive,
      "--expected-sha256",
      receipt.archiveSha256,
      "--destination",
      f.destination
    )
  );
  assert.equal(
    readFileSync(nodePath.join(f.destination, "app.txt"), "utf-8"),
    "the exact clean source\n"
  );
  assert.equal(
    readFileSync(nodePath.join(f.destination, "pnpm-lock.yaml"), "utf-8"),
    "lockfileVersion: '9.0'\n"
  );
  assert.equal(restored.sourceTreeSha256, receipt.sourceTreeSha256);
  assert.equal(receipt.baseCommit, baseCommit);
  assert.equal(receipt.restoreVerified, true);
});

await test("dirty source, untracked inputs and declared generated inputs survive with their file semantics", (t) => {
  const f = fixture(t);
  writeFileSync(nodePath.join(f.repo, ".gitignore"), ".generated/\n");
  writeFileSync(
    nodePath.join(f.repo, "obsolete.txt"),
    "removed before the build\n"
  );
  f.git("add", ".gitignore", "obsolete.txt");
  f.git("commit", "--quiet", "-m", "fixture generated boundary");
  writeFileSync(nodePath.join(f.repo, "app.txt"), "staged source\n");
  f.git("add", "app.txt");
  writeFileSync(
    nodePath.join(f.repo, "app.txt"),
    "actual source after staging\n"
  );
  rmSync(nodePath.join(f.repo, "obsolete.txt"));
  writeFileSync(
    nodePath.join(f.repo, "new-source.txt"),
    "required untracked source\n"
  );
  mkdirSync(nodePath.join(f.repo, ".generated"));
  writeFileSync(
    nodePath.join(f.repo, ".generated", "stamp.json"),
    '{"revision":"generated before capture"}\n'
  );
  writeFileSync(nodePath.join(f.repo, "run.sh"), "#!/bin/sh\nexit 0\n");
  chmodSync(nodePath.join(f.repo, "run.sh"), 0o755);
  symlinkSync(".generated/stamp.json", nodePath.join(f.repo, "current"));
  const receipt = succeeds(
    run(
      "capture",
      "--repo",
      f.repo,
      "--archive",
      f.archive,
      "--include",
      ".generated"
    )
  );
  succeeds(
    run(
      "restore",
      "--archive",
      f.archive,
      "--expected-sha256",
      receipt.archiveSha256,
      "--destination",
      f.destination
    )
  );
  assert.equal(
    readFileSync(nodePath.join(f.destination, "app.txt"), "utf-8"),
    "actual source after staging\n"
  );
  assert.equal(
    readFileSync(nodePath.join(f.destination, "new-source.txt"), "utf-8"),
    "required untracked source\n"
  );
  assert.equal(
    readFileSync(nodePath.join(f.destination, "current"), "utf-8"),
    '{"revision":"generated before capture"}\n'
  );
  assert.equal(
    readlinkSync(nodePath.join(f.destination, "current")),
    ".generated/stamp.json"
  );
  assert.equal(
    lstatSync(nodePath.join(f.destination, "run.sh")).mode % 0o1000,
    0o755
  );
  assert.equal(existsSync(nodePath.join(f.destination, "obsolete.txt")), false);
  const { manifest } = archiveFixture(readFileSync(f.archive));
  assert.match(manifest.trackedChanges, /obsolete\.txt/u);
  assert.equal(manifest.toolchain.node, process.version);
  assert.equal(manifest.toolchain.packageManager, "pnpm@11.10.0");
});

await test("capture records non-secret build configuration while excluding external credentials and outputs", (t) => {
  const f = fixture(t);
  const secret = "fixture-private-environment-value-527f";
  writeFileSync(
    nodePath.join(f.repo, ".gitignore"),
    ".env.local\n.vercel/\nnode_modules/\n.next/\n"
  );
  writeFileSync(
    nodePath.join(f.repo, ".env.local"),
    `PRIVATE_VALUE=${secret}\n`
  );
  mkdirSync(nodePath.join(f.repo, ".vercel", "output"), { recursive: true });
  writeFileSync(
    nodePath.join(f.repo, ".vercel", "project.json"),
    '{"projectId":"fixture-project","settings":{"framework":"nextjs"}}\n'
  );
  writeFileSync(
    nodePath.join(f.repo, ".vercel", "output", "artifact.txt"),
    "output is not source\n"
  );
  const receipt = succeeds(
    runWithEnv(
      { SOURCE_CAPTURE_TEST_SECRET: secret },
      "capture",
      "--repo",
      f.repo,
      "--archive",
      f.archive,
      "--build-config",
      ".vercel/project.json",
      "--secret-env",
      "SOURCE_CAPTURE_TEST_SECRET"
    )
  );
  const decoded = gunzipSync(readFileSync(f.archive)).toString();
  assert.equal(decoded.includes(secret), false);
  const { manifest } = archiveFixture(readFileSync(f.archive));
  assert.equal(
    manifest.exclusions.some((entry) => entry.pattern === "**/.env*"),
    true
  );
  assert.equal(
    manifest.entries.some((entry) => entry.path === ".env.local"),
    false
  );
  assert.equal(
    manifest.entries.some(
      (entry) => entry.path === ".vercel/output/artifact.txt"
    ),
    false
  );
  assert.equal(manifest.buildConfig?.path, ".vercel/project.json");
  assert.equal(
    manifest.lockfiles.some((entry) => entry.path === "pnpm-lock.yaml"),
    true
  );
  assert.equal(lstatSync(f.archive).mode % 0o1000, 0o600);
  succeeds(
    run(
      "restore",
      "--archive",
      f.archive,
      "--expected-sha256",
      receipt.archiveSha256,
      "--destination",
      f.destination
    )
  );
  assert.match(
    readFileSync(
      nodePath.join(f.destination, ".vercel", "project.json"),
      "utf-8"
    ),
    /fixture-project/u
  );
});

await test("the release preparation command captures the files produced by generation and stamping", (t) => {
  const f = fixture(t);
  const sourceRoot = nodePath.dirname(nodePath.dirname(command));
  const { scripts } = z
    .object({ scripts: z.record(z.string(), z.string()) })
    .parse(
      jsonValue(
        readFileSync(nodePath.join(sourceRoot, "package.json"), "utf-8")
      )
    );
  mkdirSync(nodePath.join(f.repo, "scripts"));
  mkdirSync(nodePath.join(f.repo, "src", "lib"), { recursive: true });
  mkdirSync(nodePath.join(f.repo, ".vercel"));
  writeFileSync(nodePath.join(f.repo, ".gitignore"), ".source/\n.vercel/\n");
  writeFileSync(
    nodePath.join(f.repo, ".vercel", "project.json"),
    '{"projectId":"fixture-project"}\n'
  );
  for (const name of [
    "build-source.ts",
    "build-source-archive.ts",
    "build-source-tree.ts",
    "build-source-safety.ts",
    "build-source-metadata.ts",
    "build-source-schema.ts",
    "stamp-build.mjs",
  ]) {
    writeFileSync(
      nodePath.join(f.repo, "scripts", name),
      readFileSync(nodePath.join(sourceRoot, "scripts", name))
    );
  }
  mkdirSync(nodePath.join(f.repo, "node_modules"));
  writeFileSync(
    nodePath.join(f.repo, ".npmrc"),
    "verify-deps-before-run=false\n"
  );
  symlinkSync(
    nodePath.join(sourceRoot, "node_modules", "zod"),
    nodePath.join(f.repo, "node_modules", "zod")
  );
  writeFileSync(
    nodePath.join(f.repo, "scripts", "generate-fixture.mjs"),
    'import { mkdirSync, writeFileSync } from "node:fs";\nmkdirSync(".source");\nwriteFileSync(".source/input.js", "generated before stamping\\n");\n'
  );
  writeFileSync(
    nodePath.join(f.repo, "package.json"),
    JSON.stringify({
      packageManager: "pnpm@11.10.0",
      private: true,
      scripts: {
        "deploy:prod:capture": scripts["deploy:prod:capture"],
        "deploy:prod:stamp": scripts["deploy:prod:stamp"],
        "generate:source": "node scripts/generate-fixture.mjs",
      },
      type: "module",
    })
  );
  const result = spawnSync(
    "pnpm",
    ["deploy:prod:capture", "--archive", f.archive],
    { cwd: f.repo, encoding: "utf-8" }
  );
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const receipt = receiptSchema.parse(
    jsonValue(result.stdout.trim().split("\n").at(-1) ?? "")
  );
  succeeds(
    run(
      "restore",
      "--archive",
      f.archive,
      "--expected-sha256",
      receipt.archiveSha256,
      "--destination",
      f.destination
    )
  );
  assert.equal(
    readFileSync(nodePath.join(f.destination, ".source", "input.js"), "utf-8"),
    "generated before stamping\n"
  );
  assert.match(
    readFileSync(
      nodePath.join(f.destination, "src", "lib", "build-info.generated.ts"),
      "utf-8"
    ),
    new RegExp(f.git("rev-parse", "HEAD"), "u")
  );
});

await test("credential-shaped dependency names remain recoverable package metadata", (t) => {
  const f = fixture(t);
  const packageJson =
    '{"packageManager":"pnpm@11.10.0","dependencies":{"cookie":"1.0.0","registry-auth-token":"5.1.0"}}\n';
  const lock =
    "lockfileVersion: '9.0'\nsnapshots:\n  package@1.0.0:\n    dependencies:\n      cookie: 1.0.0\n      registry-auth-token: 5.1.0\n";
  writeFileSync(nodePath.join(f.repo, "package.json"), packageJson);
  writeFileSync(nodePath.join(f.repo, "pnpm-lock.yaml"), lock);
  const receipt = succeeds(
    run("capture", "--repo", f.repo, "--archive", f.archive)
  );
  succeeds(
    run(
      "restore",
      "--archive",
      f.archive,
      "--expected-sha256",
      receipt.archiveSha256,
      "--destination",
      f.destination
    )
  );
  assert.equal(
    readFileSync(nodePath.join(f.destination, "package.json"), "utf-8"),
    packageJson
  );
  assert.equal(
    readFileSync(nodePath.join(f.destination, "pnpm-lock.yaml"), "utf-8"),
    lock
  );
});
