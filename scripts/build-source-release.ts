import {
  closeSync,
  constants,
  fchmodSync,
  fsyncSync,
  ftruncateSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import { parseArgs } from "node:util";

import { z } from "zod";

import { readArchive, restoreArchive } from "./build-source-archive.ts";
import { artifactDigest } from "./build-source-artifact.ts";
import { releaseSchema } from "./build-source-release-schema.ts";
import type { Release } from "./build-source-release-schema.ts";
import { sourceSafety } from "./build-source-safety.ts";
import { jsonValue } from "./build-source-schema.ts";
import { sha256, sourceTree } from "./build-source-tree.ts";

export const releaseArguments = () => {
  const { values } = parseArgs({
    options: {
      check: { default: false, type: "boolean" },
      receipt: { type: "string" },
      "source-archive": { type: "string" },
      "source-sha256": { type: "string" },
    },
  });
  const options = z
    .object({
      check: z.boolean(),
      receipt: z.string().min(1),
      "source-archive": z.string().min(1),
      "source-sha256": z.string().regex(/^[a-f0-9]{64}$/u),
    })
    .safeParse(values);
  if (!options.success) {
    throw new Error(
      "source evidence requires --source-archive, --source-sha256 and --receipt"
    );
  }
  return options.data;
};
type ReleaseOptions = ReturnType<typeof releaseArguments>;

export const verifiedSource = (options: ReleaseOptions) => {
  const archive = nodePath.resolve(options["source-archive"]);
  let safety = sourceSafety();
  let record = readArchive(archive, options["source-sha256"], safety);
  safety = sourceSafety(record.manifest.secretEnvironmentNames);
  record = readArchive(archive, options["source-sha256"], safety);
  const temporary = mkdtempSync(
    nodePath.join(tmpdir(), "scaffold-release-restore-")
  );
  try {
    restoreArchive(record, nodePath.join(temporary, "source"));
  } finally {
    rmSync(temporary, { force: true, recursive: true });
  }
  const { manifest } = record;
  const current = sourceTree(
    process.cwd(),
    manifest.includes,
    safety,
    manifest.buildConfig?.path
  ).source;
  if (
    current.baseCommit !== manifest.baseCommit ||
    current.sourceTreeSha256 !== manifest.sourceTreeSha256
  ) {
    throw new Error(
      "source drift since capture; rebuild from a new source record"
    );
  }
  return {
    archive,
    archiveSha256: options["source-sha256"],
    baseCommit: manifest.baseCommit,
    restoreVerified: true,
    sourceTreeSha256: manifest.sourceTreeSha256,
  };
};

export const recordPrebuilt = (options: ReleaseOptions) => {
  const source = verifiedSource(options);
  const output = nodePath.resolve(".vercel/output");
  const receipt = nodePath.join(
    realpathSync(nodePath.dirname(options.receipt)),
    nodePath.basename(options.receipt)
  );
  const relative = nodePath.relative(realpathSync(process.cwd()), receipt);
  if (
    (!relative.startsWith(".vercel/") &&
      relative !== ".." &&
      !relative.startsWith("../")) ||
    receipt === source.archive ||
    receipt.startsWith(`${output}/`)
  ) {
    throw new Error(
      "release receipt must be outside source and prebuilt output"
    );
  }
  const evidence = releaseSchema.parse({
    artifact: { path: output, sha256: artifactDigest(output) },
    checks: { acceptance: false, ready: false, revision: false },
    deployment: null,
    format: "howells-manual-release",
    source,
    status: "prebuilt-verified",
    verification: {
      artifact: "local-prebuilt-output-tree-sha256",
      deterministicRebuild: "not-verified",
      providerPackaging: "not-verified",
      source: "archive-integrity-and-restored-source-tree",
    },
    version: 1,
  });
  const bytes = `${JSON.stringify(evidence)}\n`;
  sourceSafety().check(Buffer.from(bytes), "release receipt");
  writeFileSync(receipt, bytes, { flag: "wx", flush: true, mode: 0o600 });
  return { receipt, receiptSha256: sha256(bytes), ...evidence };
};

export const assertReleaseInputs = (
  options: ReleaseOptions,
  evidence: Release
) => {
  const source = verifiedSource(options);
  if (JSON.stringify(source) !== JSON.stringify(evidence.source)) {
    throw new Error("source evidence does not match the prebuilt receipt");
  }
  const output = nodePath.resolve(".vercel/output");
  if (
    evidence.artifact.path !== output ||
    artifactDigest(output) !== evidence.artifact.sha256
  ) {
    throw new Error(
      "artifact digest does not match the verified prebuilt receipt"
    );
  }
};

export const readPrebuilt = (options: ReleaseOptions) => {
  const evidence = releaseSchema.parse(
    jsonValue(readFileSync(options.receipt, "utf-8"))
  );
  if (
    evidence.status !== "prebuilt-verified" ||
    evidence.deployment !== null ||
    Object.values(evidence.checks).some(Boolean)
  ) {
    throw new Error(
      "release receipt is not an unused verified prebuilt receipt"
    );
  }
  assertReleaseInputs(options, evidence);
  return evidence;
};

export const updateRelease = (
  options: ReleaseOptions,
  previous: Release,
  changes: Partial<Release>
) => {
  const evidence = releaseSchema.parse({ ...previous, ...changes });
  const bytes = `${JSON.stringify(evidence)}\n`;
  sourceSafety().check(Buffer.from(bytes), "release receipt");
  const descriptor = openSync(
    options.receipt,
    constants.O_RDWR + constants.O_NOFOLLOW
  );
  try {
    const current = releaseSchema.parse(
      jsonValue(readFileSync(descriptor, "utf-8"))
    );
    if (JSON.stringify(current) !== JSON.stringify(previous)) {
      throw new Error("release receipt changed during publication");
    }
    fchmodSync(descriptor, 0o600);
    const buffer = Buffer.from(bytes);
    let offset = 0;
    while (offset < buffer.length) {
      offset += writeSync(
        descriptor,
        buffer,
        offset,
        buffer.length - offset,
        offset
      );
    }
    ftruncateSync(descriptor, buffer.length);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  return evidence;
};
