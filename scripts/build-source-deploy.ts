import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import nodePath from "node:path";
import { env as environment } from "node:process";
import { parseArgs } from "node:util";

import { z } from "zod";

import { sourceSafety } from "./build-source-safety.ts";
import { digestSchema, jsonValue } from "./build-source-schema.ts";

const safety = sourceSafety();
const run = (args: string[], env = environment) => {
  const result = spawnSync("pnpm", args, {
    encoding: "utf-8",
    env,
    maxBuffer: 32 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  process.stdout.write(safety.redact(result.stdout ?? ""));
  process.stderr.write(safety.redact(result.stderr ?? ""));
  if (result.status !== 0) {
    throw new Error(
      `pnpm ${args[0]} failed${result.error === undefined ? "" : `: ${result.error.message}`}`
    );
  }
  return result.stdout;
};

try {
  const { values } = parseArgs({
    options: {
      "evidence-dir": { type: "string" },
      "no-publish": { default: false, type: "boolean" },
    },
  });
  run(["deploy:prod:pull"]);
  const evidenceRoot = nodePath.resolve(values["evidence-dir"] ?? ".vercel");
  mkdirSync(evidenceRoot, { mode: 0o700, recursive: true });
  const directory = mkdtempSync(nodePath.join(evidenceRoot, "release-"));
  const archive = nodePath.join(directory, "source.json.gz");
  const captured = run(["deploy:prod:capture", "--archive", archive]);
  const source = z
    .strictObject({
      archive: z.string(),
      archiveSha256: digestSchema,
      baseCommit: z.string().regex(/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u),
      restoreVerified: z.literal(true),
      sourceTreeSha256: digestSchema,
      version: z.literal(1),
    })
    .parse(jsonValue(captured.trim().split("\n").at(-1) ?? ""));
  writeFileSync(
    nodePath.join(directory, "source-receipt.json"),
    `${JSON.stringify(source)}\n`,
    { flag: "wx", flush: true, mode: 0o600 }
  );
  const buildEnv = { ...environment, VERCEL_GIT_COMMIT_SHA: source.baseCommit };
  run(["deploy:prod:build"], buildEnv);
  const releaseReceipt = nodePath.join(directory, "release.json");
  const args = [
    "--source-archive",
    archive,
    "--source-sha256",
    source.archiveSha256,
    "--receipt",
    releaseReceipt,
  ];
  run(["deploy:prod:verify", ...args], buildEnv);
  if (!values["no-publish"]) {
    run(["deploy:prod:publish", ...args], buildEnv);
  }
  process.stdout.write(
    `${JSON.stringify({ published: !values["no-publish"], releaseReceipt })}\n`
  );
} catch (error) {
  process.stderr.write(
    `deploy:prod: ${safety.redact(error instanceof Error ? error.message : "release failed")}\n`
  );
  process.exitCode = 1;
}
