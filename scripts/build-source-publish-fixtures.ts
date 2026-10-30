import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import nodePath from "node:path";
import { env as environment } from "node:process";
import type { TestContext } from "node:test";

import { z } from "zod";

import { fixture, jsonValue, succeeds } from "./build-source-fixtures.ts";

export const releaseReceipt = (file: string) =>
  z
    .looseObject({
      artifact: z.looseObject({ sha256: z.string().regex(/^[a-f0-9]{64}$/u) }),
      checks: z.object({
        acceptance: z.boolean(),
        ready: z.boolean(),
        revision: z.boolean(),
      }),
      deployment: z.object({ id: z.string(), url: z.string() }).nullable(),
      source: z.looseObject({
        archiveSha256: z.string(),
        baseCommit: z.string(),
        restoreVerified: z.literal(true),
        sourceTreeSha256: z.string(),
      }),
      status: z.string(),
      verification: z.object({
        artifact: z.string(),
        deterministicRebuild: z.string(),
        providerPackaging: z.string(),
      }),
    })
    .parse(jsonValue(readFileSync(file, "utf-8")));

const outputFixture = (repo: string) => {
  const output = nodePath.join(repo, ".vercel", "output");
  const functionDir = nodePath.join(output, "functions", "index.func");
  mkdirSync(functionDir, { recursive: true });
  writeFileSync(nodePath.join(output, "config.json"), '{"version":3}\n');
  writeFileSync(
    nodePath.join(functionDir, ".vc-config.json"),
    JSON.stringify({
      architecture: "x86_64",
      filePathMap: {
        "node_modules/@img+sharp-linux-x64/sharp.node": "sharp.node",
      },
    })
  );
  writeFileSync(
    nodePath.join(functionDir, "index.js"),
    'export default "fixture output";\n'
  );
  writeFileSync(
    nodePath.join(functionDir, "sharp.node"),
    Buffer.from("7f454c4602010100000000000000000003003e00", "hex")
  );
  return output;
};

export const releaseFixture = (t: TestContext) => {
  const f = fixture(t);
  const bin = nodePath.join(f.root, "bin");
  const transport = nodePath.join(f.root, "transport.jsonl");
  const provider = nodePath.join(f.root, "provider.json");
  mkdirSync(bin);
  writeFileSync(
    provider,
    JSON.stringify({
      id: "dpl_fixture123",
      readyState: "READY",
      url: "scaffold-fixture-123.vercel.app",
    })
  );
  const recorder = nodePath.join(bin, "vercel");
  writeFileSync(
    recorder,
    `#!${process.execPath}
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
const args = process.argv.slice(2);
appendFileSync(${JSON.stringify(transport)}, JSON.stringify(args) + "\\n");
const provider = JSON.parse(readFileSync(${JSON.stringify(provider)}, "utf-8"));
const command = args[0] === "--scope" ? args[2] : args[0];
if (command === "deploy") {
  if (provider.mutateArtifact) writeFileSync(".vercel/output/functions/index.func/index.js", "changed during upload");
  console.log("https://scaffold-fixture-123.vercel.app");
}
else if (command === "inspect") console.log(JSON.stringify(args.includes("--wait") ? provider.final ?? provider : provider));
else if (command === "curl") console.log(args[5] === "/" ? provider.homepage ?? "Scaffold" : JSON.stringify({ sha: provider.runtimeSha ?? ${JSON.stringify(f.git("rev-parse", "HEAD"))} }));
else if (command === "promote" && provider.promotionError) {
  console.error("fixture promotion rejected");
  process.exitCode = 1;
}
`
  );
  chmodSync(recorder, 0o755);
  const output = outputFixture(f.repo);
  const receipt = nodePath.join(f.repo, ".vercel", "release.json");
  const env = {
    ...environment,
    PATH: `${bin}:${environment.PATH ?? ""}`,
    VERCEL_GIT_COMMIT_SHA: f.git("rev-parse", "HEAD"),
  };
  const command = (script: string, ...args: string[]) =>
    spawnSync(
      process.execPath,
      [nodePath.join(import.meta.dirname, script), ...args],
      {
        cwd: f.repo,
        encoding: "utf-8",
        env,
      }
    );
  const calls = () =>
    existsSync(transport)
      ? z.array(z.array(z.string())).parse(
          readFileSync(transport, "utf-8")
            .trim()
            .split("\n")
            .map((line) => jsonValue(line))
        )
      : [];
  const capture = () =>
    succeeds(
      command(
        "build-source.ts",
        "capture",
        "--repo",
        f.repo,
        "--archive",
        f.archive
      )
    );
  const evidenceArgs = (digest: string) => [
    "--source-archive",
    f.archive,
    "--source-sha256",
    digest,
    "--receipt",
    receipt,
  ];
  const providerResult = (
    changes: Record<string, z.infer<ReturnType<typeof z.json>>>
  ) => {
    writeFileSync(
      provider,
      JSON.stringify({
        id: "dpl_fixture123",
        readyState: "READY",
        url: "scaffold-fixture-123.vercel.app",
        ...changes,
      })
    );
  };
  return {
    ...f,
    calls,
    capture,
    command,
    env,
    evidenceArgs,
    output,
    provider,
    providerResult,
    receipt,
  };
};

export const successfulCommand = (
  result: ReturnType<ReturnType<typeof releaseFixture>["command"]>
) => {
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
};
