import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { appendFileSync, lstatSync, readFileSync } from "node:fs";
import nodePath from "node:path";
import { test } from "node:test";

import { z } from "zod";

import { jsonValue, succeeds } from "./build-source-fixtures.ts";
import {
  releaseReceipt,
  successfulCommand,
} from "./build-source-publish-fixtures.ts";
import { chainFixture } from "./build-source-release-chain-fixtures.ts";

await test("the production command captures generated and stamped inputs before building and verifying without publication", (t) => {
  const f = chainFixture(t);
  const result = spawnSync("pnpm", ["deploy:prod", "--no-publish"], {
    cwd: f.repo,
    encoding: "utf-8",
    env: f.env,
  });
  successfulCommand(result);
  const receipt = z
    .object({ published: z.literal(false), releaseReceipt: z.string() })
    .parse(jsonValue(result.stdout.trim().split("\n").at(-1) ?? ""));
  const release = releaseReceipt(receipt.releaseReceipt);
  const source = z.object({ archive: z.string() }).parse(release.source);
  succeeds(
    f.command(
      "build-source.ts",
      "restore",
      "--archive",
      source.archive,
      "--expected-sha256",
      release.source.archiveSha256,
      "--destination",
      f.destination
    )
  );
  assert.equal(
    readFileSync(nodePath.join(f.destination, ".source", "input.js"), "utf-8"),
    "generated before capture\n"
  );
  assert.match(
    readFileSync(
      nodePath.join(f.destination, "src", "lib", "build-info.generated.ts"),
      "utf-8"
    ),
    new RegExp(release.source.baseCommit, "u")
  );
  assert.equal(release.status, "prebuilt-verified");
  assert.equal(
    f
      .calls()
      .some((args) => args.includes("deploy") || args.includes("promote")),
    false
  );
});

await test("the complete production command publishes only the generated source and artifact bound in its receipt", (t) => {
  const f = chainFixture(t);
  const result = spawnSync("pnpm", ["deploy:prod"], {
    cwd: f.repo,
    encoding: "utf-8",
    env: f.env,
  });
  successfulCommand(result);
  const receipt = z
    .object({ published: z.literal(true), releaseReceipt: z.string() })
    .parse(jsonValue(result.stdout.trim().split("\n").at(-1) ?? ""));
  const release = releaseReceipt(receipt.releaseReceipt);
  assert.equal(release.status, "promoted");
  assert.equal(release.deployment?.id, "dpl_fixture123");
  assert.deepEqual(release.checks, {
    acceptance: true,
    ready: true,
    revision: true,
  });
});

await test("source drift during the build stops the production command before upload", (t) => {
  const f = chainFixture(t);
  appendFileSync(
    nodePath.join(f.repo, "scripts", "fixture-build.mjs"),
    '\nwriteFileSync("app.txt", "source drifted during build\\n");\n'
  );
  const result = spawnSync("pnpm", ["deploy:prod"], {
    cwd: f.repo,
    encoding: "utf-8",
    env: f.env,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /source drift/u);
  assert.equal(
    f
      .calls()
      .some((call) => call.includes("deploy") || call.includes("promote")),
    false
  );
});

await test("a disposable build checkout can retain its evidence in an explicitly chosen private directory", (t) => {
  const f = chainFixture(t);
  const evidence = nodePath.join(f.root, "private-releases");
  const result = spawnSync(
    "pnpm",
    ["deploy:prod", "--no-publish", "--evidence-dir", evidence],
    { cwd: f.repo, encoding: "utf-8", env: f.env }
  );
  successfulCommand(result);
  const receipt = z
    .object({ releaseReceipt: z.string() })
    .parse(jsonValue(result.stdout.trim().split("\n").at(-1) ?? ""));
  assert.equal(receipt.releaseReceipt.startsWith(`${evidence}/`), true);
  assert.equal(lstatSync(evidence).mode % 0o1000, 0o700);
  const release = releaseReceipt(receipt.releaseReceipt);
  const source = z.object({ archive: z.string() }).parse(release.source);
  assert.equal(source.archive.startsWith(`${evidence}/`), true);
  assert.equal(lstatSync(source.archive).mode % 0o1000, 0o600);
});
