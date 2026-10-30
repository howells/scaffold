import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  appendFileSync,
  lstatSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import nodePath from "node:path";
import { test } from "node:test";
import { gzipSync } from "node:zlib";

import { archiveFixture } from "./build-source-fixtures.ts";
import {
  releaseFixture,
  releaseReceipt,
  successfulCommand,
} from "./build-source-publish-fixtures.ts";
import type { JsonValue } from "./build-source-schema.ts";

await test("publisher rejects missing source evidence before contacting the provider", (t) => {
  const f = releaseFixture(t);
  const result = f.command("publish-vercel-prebuilt.mjs");
  assert.equal(result.status, 1);
  assert.deepEqual(
    f.calls(),
    [],
    "incomplete evidence must not reach upload or any provider command"
  );
  assert.match(result.stderr, /source evidence/u);
});

await test("provider promotion rejection records failure and cleans up only the verified deployment", (t) => {
  const f = releaseFixture(t);
  const source = f.capture();
  const args = f.evidenceArgs(source.archiveSha256);
  successfulCommand(f.command("check-vercel-prebuilt.mjs", ...args));
  f.providerResult({ promotionError: true });
  const result = f.command("publish-vercel-prebuilt.mjs", ...args);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /fixture promotion rejected/u);
  assert.equal(releaseReceipt(f.receipt).status, "failed");
  const cleanup = f.calls().filter((call) => call[2] === "remove");
  assert.deepEqual(cleanup, [
    [
      "--scope",
      "danielhowells",
      "remove",
      "dpl_fixture123",
      "--safe",
      "--yes",
      "--no-color",
    ],
  ]);
  assert.equal(result.stdout.includes("and promoted"), false);
});

await test("an inspection for a different immutable URL cannot promote or remove that deployment", (t) => {
  const f = releaseFixture(t);
  const source = f.capture();
  const args = f.evidenceArgs(source.archiveSha256);
  successfulCommand(f.command("check-vercel-prebuilt.mjs", ...args));
  writeFileSync(
    f.provider,
    JSON.stringify({
      id: "dpl_different456",
      readyState: "READY",
      url: "different-deployment.vercel.app",
    })
  );
  const result = f.command("publish-vercel-prebuilt.mjs", ...args);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /immutable deployment identity/u);
  assert.equal(
    f.calls().some((call) => call[2] === "promote" || call[2] === "remove"),
    false
  );
  assert.notEqual(releaseReceipt(f.receipt).status, "promoted");
});

await test("publisher binds the exact deployment to verified source and output only after live probes and promotion", (t) => {
  const f = releaseFixture(t);
  const source = f.capture();
  const args = f.evidenceArgs(source.archiveSha256);
  successfulCommand(f.command("check-vercel-prebuilt.mjs", ...args));
  const prepared = releaseReceipt(f.receipt);
  successfulCommand(f.command("publish-vercel-prebuilt.mjs", ...args));
  const published = releaseReceipt(f.receipt);
  assert.equal(published.status, "promoted");
  assert.deepEqual(published.deployment, {
    id: "dpl_fixture123",
    url: "https://scaffold-fixture-123.vercel.app",
  });
  assert.deepEqual(published.source, prepared.source);
  assert.deepEqual(published.artifact, prepared.artifact);
  assert.deepEqual(published.checks, {
    acceptance: true,
    ready: true,
    revision: true,
  });
  const calls = f.calls();
  assert.deepEqual(
    calls.map((call) => call[2]),
    ["deploy", "inspect", "inspect", "curl", "curl", "promote"]
  );
  assert.equal(calls[3]?.[4], "dpl_fixture123");
  assert.match(
    calls[3]?.[5] ?? "",
    new RegExp(`expected=${source.baseCommit}`, "u")
  );
  assert.equal(calls[5]?.[3], "dpl_fixture123");
});

await test("prebuilt verification binds the trusted recoverable source to a local artifact receipt", (t) => {
  const f = releaseFixture(t);
  const source = f.capture();
  successfulCommand(
    f.command(
      "check-vercel-prebuilt.mjs",
      ...f.evidenceArgs(source.archiveSha256)
    )
  );
  const receipt = releaseReceipt(f.receipt);
  assert.equal(receipt.source.archiveSha256, source.archiveSha256);
  assert.equal(receipt.source.sourceTreeSha256, source.sourceTreeSha256);
  assert.equal(receipt.source.baseCommit, source.baseCommit);
  assert.equal(receipt.status, "prebuilt-verified");
  assert.equal(
    receipt.verification.artifact,
    "local-prebuilt-output-tree-sha256"
  );
  assert.equal(receipt.verification.providerPackaging, "not-verified");
  assert.equal(receipt.verification.deterministicRebuild, "not-verified");
  assert.deepEqual(f.calls(), []);
  assert.equal(lstatSync(f.receipt).mode % 0o1000, 0o600);
});

await test("publisher rechecks missing, tampered, inconsistent and unverified evidence before any provider command", async (t) => {
  const cases = [
    "missing archive",
    "missing receipt",
    "archive tampering",
    "omitted source content",
    "wrong trusted digest",
    "unverified restore",
    "inconsistent source",
    "source drift",
    "artifact drift",
    "wrong architecture",
    "invalid native binary",
  ];
  await Promise.all(
    cases.map(async (scenario) => {
      await t.test(scenario, (child) => {
        const f = releaseFixture(child);
        const source = f.capture();
        const args = f.evidenceArgs(source.archiveSha256);
        successfulCommand(f.command("check-vercel-prebuilt.mjs", ...args));
        if (scenario === "missing archive") {
          rmSync(f.archive);
        }
        if (scenario === "missing receipt") {
          rmSync(f.receipt);
        }
        if (scenario === "archive tampering") {
          appendFileSync(f.archive, "tampered");
        }
        if (scenario === "omitted source content") {
          const record = archiveFixture(readFileSync(f.archive));
          delete record.contents["app.txt"];
          const bytes = gzipSync(JSON.stringify(record));
          const digest = createHash("sha256").update(bytes).digest("hex");
          writeFileSync(f.archive, bytes);
          args[3] = digest;
          const receipt = releaseReceipt(f.receipt);
          receipt.source.archiveSha256 = digest;
          writeFileSync(f.receipt, JSON.stringify(receipt));
        }
        if (scenario === "wrong trusted digest") {
          args[3] = "a".repeat(64);
        }
        if (scenario === "unverified restore") {
          writeFileSync(
            f.receipt,
            readFileSync(f.receipt, "utf-8").replace(
              '"restoreVerified":true',
              '"restoreVerified":false'
            )
          );
        }
        if (scenario === "inconsistent source") {
          const receipt = releaseReceipt(f.receipt);
          receipt.source.sourceTreeSha256 = "b".repeat(64);
          writeFileSync(f.receipt, JSON.stringify(receipt));
        }
        if (scenario === "source drift") {
          writeFileSync(nodePath.join(f.repo, "app.txt"), "changed source\n");
        }
        if (scenario === "artifact drift") {
          writeFileSync(
            nodePath.join(f.output, "functions", "index.func", "index.js"),
            "changed output\n"
          );
        }
        if (scenario === "wrong architecture") {
          writeFileSync(
            nodePath.join(
              f.output,
              "functions",
              "index.func",
              ".vc-config.json"
            ),
            '{"architecture":"arm64"}'
          );
        }
        if (scenario === "invalid native binary") {
          writeFileSync(
            nodePath.join(f.output, "functions", "index.func", "sharp.node"),
            "not a Linux native binary"
          );
        }
        const result = f.command("publish-vercel-prebuilt.mjs", ...args);
        assert.equal(result.status, 1, result.stdout);
        assert.deepEqual(f.calls(), [], scenario);
      });
    })
  );
});

await test("incomplete deployment identity and failed live acceptance cannot reach promotion", async (t) => {
  const scenarios: Record<string, JsonValue>[] = [
    { id: "" },
    { url: "" },
    {
      final: {
        id: "dpl_other456",
        readyState: "READY",
        url: "scaffold-fixture-123.vercel.app",
      },
    },
    { final: { id: "dpl_fixture123", readyState: "READY" } },
    { readyState: "ERROR" },
    { runtimeSha: "f".repeat(40) },
    { homepage: "unexpected homepage" },
    { mutateArtifact: true },
  ];
  await Promise.all(
    scenarios.map(async (provider, index) => {
      await t.test(`provider result ${index + 1}`, (child) => {
        const f = releaseFixture(child);
        const source = f.capture();
        const args = f.evidenceArgs(source.archiveSha256);
        successfulCommand(f.command("check-vercel-prebuilt.mjs", ...args));
        f.providerResult(provider);
        const result = f.command("publish-vercel-prebuilt.mjs", ...args);
        assert.equal(result.status, 1, result.stdout);
        assert.equal(
          f.calls().some((call) => call[2] === "promote"),
          false
        );
        assert.equal(releaseReceipt(f.receipt).status, "failed");
        assert.equal(
          f
            .calls()
            .filter((call) => call[2] === "remove")
            .every((call) => call[3] === "dpl_fixture123"),
          true
        );
      });
    })
  );
});
