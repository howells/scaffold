import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import nodePath from "node:path";
import { test } from "node:test";
import { gzipSync } from "node:zlib";

import {
  archiveFixture,
  fixture,
  rejects,
  run,
  runWithEnv,
  succeeds,
} from "./build-source-fixtures.ts";

await test("a credential embedded in required JSON configuration fails without leaving an archive or leaking its value", (t) => {
  const f = fixture(t);
  const value = "fixture-unexported-credential-925a";
  writeFileSync(
    nodePath.join(f.repo, "provider.json"),
    JSON.stringify({ apiKey: value })
  );
  const result = run(
    "capture",
    "--repo",
    f.repo,
    "--archive",
    f.archive,
    "--build-config",
    "provider.json"
  );
  rejects(result, /unsafe required input.*provider\.json/u);
  assert.equal(`${result.stdout}${result.stderr}`.includes(value), false);
  assert.equal(existsSync(f.archive), false);
});

await test("a symlink cannot stand in for source outside the captured tree", (t) => {
  const f = fixture(t);
  writeFileSync(
    nodePath.join(f.root, "private.txt"),
    "outside the source boundary\n"
  );
  symlinkSync("../private.txt", nodePath.join(f.repo, "external"));
  rejects(
    run("capture", "--repo", f.repo, "--archive", f.archive),
    /unsafe.*symlink.*external/u
  );
  assert.equal(existsSync(f.archive), false);
});

await test("required environment files and exported secret values are rejected without disclosure", (t) => {
  const f = fixture(t);
  const value = "fixture-custom-secret-value-760b";
  writeFileSync(
    nodePath.join(f.repo, ".env.local"),
    `PRIVATE_VALUE=${value}\n`
  );
  const environmentFile = run(
    "capture",
    "--repo",
    f.repo,
    "--archive",
    f.archive,
    "--include",
    ".env.local"
  );
  rejects(environmentFile, /unsafe required input.*\.env\.local/u);
  assert.equal(environmentFile.stderr.includes(value), false);
  writeFileSync(nodePath.join(f.repo, "app.txt"), value);
  const embedded = runWithEnv(
    { CUSTOM_BUILD_INPUT: value },
    "capture",
    "--repo",
    f.repo,
    "--archive",
    f.archive,
    "--secret-env",
    "CUSTOM_BUILD_INPUT"
  );
  rejects(embedded, /unsafe required input.*app\.txt/u);
  assert.equal(embedded.stderr.includes(value), false);
  assert.equal(existsSync(f.archive), false);
});

await test("symlink parent traversal follows the resolved directory and requires its actual target", (t) => {
  const f = fixture(t);
  mkdirSync(nodePath.join(f.repo, "real", "nested"), { recursive: true });
  writeFileSync(nodePath.join(f.repo, ".gitignore"), "real/target\n");
  writeFileSync(
    nodePath.join(f.repo, "real", "nested", "anchor.txt"),
    "keep the directory\n"
  );
  writeFileSync(
    nodePath.join(f.repo, "real", "target"),
    "the actual consumed source\n"
  );
  writeFileSync(nodePath.join(f.repo, "target"), "a different root target\n");
  symlinkSync("real/nested", nodePath.join(f.repo, "d"));
  symlinkSync("d/../target", nodePath.join(f.repo, "link"));
  rejects(
    run("capture", "--repo", f.repo, "--archive", f.archive),
    /unsafe or uncaptured source symlink.*link/u
  );
  assert.equal(existsSync(f.archive), false);
  const receipt = succeeds(
    run(
      "capture",
      "--repo",
      f.repo,
      "--archive",
      f.archive,
      "--include",
      "real/target"
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
    readFileSync(nodePath.join(f.destination, "link"), "utf-8"),
    "the actual consumed source\n"
  );
});

await test("unsupported build configuration and literal YAML credentials fail without disclosure", (t) => {
  const f = fixture(t);
  const value = "fixture-unexported-credential-632b";
  writeFileSync(nodePath.join(f.repo, "build.yaml"), `apiKey: ${value}\n`);
  const unsupported = run(
    "capture",
    "--repo",
    f.repo,
    "--archive",
    f.archive,
    "--build-config",
    "build.yaml"
  );
  rejects(unsupported, /unsupported build configuration.*build\.yaml/u);
  assert.equal(unsupported.stderr.includes(value), false);
  assert.equal(existsSync(f.archive), false);
  const embedded = run("capture", "--repo", f.repo, "--archive", f.archive);
  rejects(embedded, /unsafe required input.*build\.yaml/u);
  assert.equal(embedded.stderr.includes(value), false);
  assert.equal(existsSync(f.archive), false);
});

await test("verification rejects changed content, changed permissions and new untracked source", (t) => {
  const f = fixture(t);
  const receipt = succeeds(
    run("capture", "--repo", f.repo, "--archive", f.archive)
  );
  const args = [
    "verify",
    "--archive",
    f.archive,
    "--expected-sha256",
    receipt.archiveSha256,
    "--repo",
    f.repo,
  ];
  assert.equal(succeeds(run(...args)).sourceMatches, true);
  writeFileSync(
    nodePath.join(f.repo, "app.txt"),
    "source changed after capture\n"
  );
  rejects(run(...args), /source drift/u);
  writeFileSync(nodePath.join(f.repo, "app.txt"), "the exact clean source\n");
  chmodSync(nodePath.join(f.repo, "app.txt"), 0o755);
  rejects(run(...args), /source drift/u);
  chmodSync(nodePath.join(f.repo, "app.txt"), 0o644);
  writeFileSync(
    nodePath.join(f.repo, "new-input.txt"),
    "unexpected build input\n"
  );
  rejects(run(...args), /source drift/u);
});

await test("even a transport-verified archive cannot restore a path outside its disposable destination", (t) => {
  const f = fixture(t);
  succeeds(run("capture", "--repo", f.repo, "--archive", f.archive));
  const record = archiveFixture(readFileSync(f.archive));
  const escapedEntry = record.manifest.entries.find(
    (entry) => entry.path === "app.txt"
  );
  assert.ok(escapedEntry);
  escapedEntry.path = "../escaped.txt";
  const appContent = record.contents["app.txt"];
  assert.ok(appContent !== undefined);
  record.contents["../escaped.txt"] = appContent;
  delete record.contents["app.txt"];
  record.manifest.sourceTreeSha256 = createHash("sha256")
    .update(JSON.stringify(record.manifest.entries))
    .digest("hex");
  const bytes = gzipSync(JSON.stringify(record));
  writeFileSync(f.archive, bytes);
  const digest = createHash("sha256").update(bytes).digest("hex");
  rejects(
    run(
      "restore",
      "--archive",
      f.archive,
      "--expected-sha256",
      digest,
      "--destination",
      f.destination
    ),
    /unsafe source path/u
  );
  assert.equal(existsSync(nodePath.join(f.root, "escaped.txt")), false);
  assert.equal(existsSync(f.destination), false);
});

await test("missing required inputs and dependency locks cannot produce a complete source receipt", (t) => {
  const f = fixture(t);
  rejects(
    run(
      "capture",
      "--repo",
      f.repo,
      "--archive",
      f.archive,
      "--include",
      ".generated"
    ),
    /missing required input.*\.generated/u
  );
  assert.equal(existsSync(f.archive), false);
  rmSync(nodePath.join(f.repo, "pnpm-lock.yaml"));
  rejects(
    run("capture", "--repo", f.repo, "--archive", f.archive),
    /missing required dependency lock/u
  );
  assert.equal(existsSync(f.archive), false);
});

await test("archive transport tampering and omitted file content fail before any restoration", (t) => {
  const f = fixture(t);
  const receipt = succeeds(
    run("capture", "--repo", f.repo, "--archive", f.archive)
  );
  const bytes = readFileSync(f.archive);
  writeFileSync(f.archive, Buffer.concat([bytes, Buffer.from("tampered")]));
  rejects(
    run(
      "restore",
      "--archive",
      f.archive,
      "--expected-sha256",
      receipt.archiveSha256,
      "--destination",
      f.destination
    ),
    /archive SHA-256/u
  );
  assert.equal(existsSync(f.destination), false);
  const record = archiveFixture(bytes);
  delete record.contents["app.txt"];
  const incomplete = gzipSync(JSON.stringify(record));
  writeFileSync(f.archive, incomplete);
  const digest = createHash("sha256").update(incomplete).digest("hex");
  rejects(
    run(
      "restore",
      "--archive",
      f.archive,
      "--expected-sha256",
      digest,
      "--destination",
      f.destination
    ),
    /missing archive content.*app\.txt/u
  );
  assert.equal(existsSync(f.destination), false);
});

await test("capture cannot create its evidence inside the selected source", (t) => {
  const f = fixture(t);
  const output = nodePath.join(f.repo, "source.json.gz");
  rejects(
    run("capture", "--repo", f.repo, "--archive", output),
    /archive.*outside.*source/u
  );
  assert.equal(existsSync(output), false);
});
