import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import { env as environment } from "node:process";
import type { TestContext } from "node:test";
import { gunzipSync } from "node:zlib";

import { z } from "zod";

const jsonValue = (text: string) => z.json().parse(JSON.parse(text));
const receiptSchema = z.looseObject({
  archiveSha256: z.string().default(""),
  baseCommit: z.string().default(""),
  restoreVerified: z.boolean().default(false),
  sourceMatches: z.boolean().default(false),
  sourceTreeSha256: z.string(),
});
const archiveFixtureSchema = z.looseObject({
  contents: z.record(z.string(), z.string()),
  manifest: z.looseObject({
    buildConfig: z.looseObject({ path: z.string() }).nullable(),
    entries: z.array(z.looseObject({ path: z.string() })),
    exclusions: z.array(z.looseObject({ pattern: z.string() })),
    lockfiles: z.array(z.looseObject({ path: z.string() })),
    sourceTreeSha256: z.string(),
    toolchain: z.looseObject({ node: z.string(), packageManager: z.string() }),
    trackedChanges: z.string(),
  }),
});
const archiveFixture = (bytes: Buffer) =>
  archiveFixtureSchema.parse(jsonValue(gunzipSync(bytes).toString()));

const command = nodePath.join(import.meta.dirname, "build-source.ts");

const fixture = (t: TestContext) => {
  const root = mkdtempSync(nodePath.join(tmpdir(), "scaffold-build-source-"));
  t.after(() => {
    rmSync(root, { force: true, recursive: true });
  });
  const repo = nodePath.join(root, "source");
  mkdirSync(repo);
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: repo, encoding: "utf-8" }).trim();
  git("init", "--quiet");
  git("config", "user.name", "Source fixture");
  git("config", "user.email", "source-fixture@example.invalid");
  writeFileSync(
    nodePath.join(repo, "package.json"),
    '{"private":true,"packageManager":"pnpm@11.10.0"}\n'
  );
  writeFileSync(
    nodePath.join(repo, "pnpm-lock.yaml"),
    "lockfileVersion: '9.0'\n"
  );
  writeFileSync(nodePath.join(repo, "app.txt"), "the exact clean source\n");
  git("add", "package.json", "pnpm-lock.yaml", "app.txt");
  git("commit", "--quiet", "-m", "fixture source");
  return {
    archive: nodePath.join(root, "source.json.gz"),
    destination: nodePath.join(root, "restored"),
    git,
    repo,
    root,
  };
};

const runWithEnv = (env: Partial<NodeJS.ProcessEnv>, ...args: string[]) =>
  spawnSync(process.execPath, [command, ...args], {
    encoding: "utf-8",
    env: { ...environment, ...env },
  });
const run = (...args: string[]) => runWithEnv({}, ...args);

const succeeds = (result: SpawnSyncReturns<string>) => {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return receiptSchema.parse(jsonValue(result.stdout));
};

const rejects = (result: SpawnSyncReturns<string>, message: RegExp) => {
  assert.equal(result.status, 1);
  assert.match(result.stderr, message);
  assert.equal(result.stdout, "");
};

export {
  archiveFixture,
  command,
  fixture,
  jsonValue,
  receiptSchema,
  rejects,
  run,
  runWithEnv,
  succeeds,
};
