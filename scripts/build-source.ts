import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import { parseArgs } from "node:util";

import {
  encodeArchive,
  readArchive,
  restoreArchive,
} from "./build-source-archive.ts";
import { sourceManifest } from "./build-source-metadata.ts";
import { sourceSafety } from "./build-source-safety.ts";
import type { SourceManifest } from "./build-source-schema.ts";
import { sha256, sourceTree, comparePaths } from "./build-source-tree.ts";

let safety = sourceSafety();
const verifyCurrentSource = (root: string, manifest: SourceManifest) => {
  const { source } = sourceTree(
    root,
    manifest.includes,
    safety,
    manifest.buildConfig?.path
  );
  if (
    source.sourceTreeSha256 !== manifest.sourceTreeSha256 ||
    source.baseCommit !== manifest.baseCommit
  ) {
    throw new Error(
      "source drift since capture; create a new source record after preparation"
    );
  }
};

const checkArchiveLocation = (
  archive: string,
  root: string,
  includes: string[]
) => {
  const output = nodePath.join(
    realpathSync(nodePath.dirname(archive)),
    nodePath.basename(archive)
  );
  const path = nodePath.relative(realpathSync(root), output);
  if (
    !nodePath.isAbsolute(path) &&
    path !== ".." &&
    !path.startsWith("../") &&
    (!path.startsWith(".vercel/") ||
      includes.some((input) => path === input || path.startsWith(`${input}/`)))
  ) {
    throw new Error(
      "archive must be outside the source tree or in excluded .vercel release state"
    );
  }
};

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      archive: { type: "string" },
      "build-config": { type: "string" },
      destination: { type: "string" },
      "expected-sha256": { type: "string" },
      include: { default: [], multiple: true, type: "string" },
      repo: { type: "string" },
      "secret-env": { default: [], multiple: true, type: "string" },
    },
  });
  const [command] = positionals;
  if (
    values.archive === undefined ||
    values.archive === "" ||
    positionals.length !== 1
  ) {
    throw new Error(
      "usage: build-source.ts capture|verify|restore --archive PATH [--repo PATH | --destination PATH --expected-sha256 DIGEST]"
    );
  }
  const archive = nodePath.resolve(values.archive);
  safety = sourceSafety(values["secret-env"]);
  let receipt;
  if (command === "capture") {
    const root = nodePath.resolve(values.repo ?? ".");
    const configPath = values["build-config"];
    if (configPath !== undefined && !configPath.endsWith(".json")) {
      throw new Error(
        `unsupported build configuration: ${configPath}; use JSON`
      );
    }
    const includes = [
      ...new Set([
        ...values.include,
        ...(configPath === undefined ? [] : [configPath]),
      ]),
    ].toSorted(comparePaths);
    checkArchiveLocation(archive, root, includes);
    const snapshot = sourceTree(root, includes, safety, configPath);
    const { source, contents } = snapshot;
    const manifest = sourceManifest(root, snapshot, safety, configPath);
    safety.check(Buffer.from(JSON.stringify(manifest)), "source manifest");
    const bytes = encodeArchive(manifest, contents);
    const archiveSha256 = sha256(bytes);
    const temporary = mkdtempSync(
      nodePath.join(tmpdir(), "scaffold-source-restore-")
    );
    try {
      const staged = nodePath.join(temporary, "source.json.gz");
      writeFileSync(staged, bytes, { flag: "wx", mode: 0o600 });
      const record = readArchive(staged, archiveSha256, safety);
      restoreArchive(record, nodePath.join(temporary, "source"));
      verifyCurrentSource(root, record.manifest);
      writeFileSync(archive, bytes, { flag: "wx", mode: 0o600 });
      readArchive(archive, archiveSha256, safety);
    } finally {
      rmSync(temporary, { force: true, recursive: true });
    }
    receipt = {
      archive,
      archiveSha256,
      baseCommit: source.baseCommit,
      restoreVerified: true,
      sourceTreeSha256: source.sourceTreeSha256,
      version: 1,
    };
  } else if (command === "verify") {
    if (values.repo === undefined || values.repo === "") {
      throw new Error("verify requires --repo");
    }
    const record = readArchive(archive, values["expected-sha256"], safety);
    verifyCurrentSource(nodePath.resolve(values.repo), record.manifest);
    receipt = {
      sourceMatches: true,
      sourceTreeSha256: record.manifest.sourceTreeSha256,
      version: 1,
    };
  } else if (command === "restore") {
    if (values.destination === undefined || values.destination === "") {
      throw new Error("restore requires --destination");
    }
    const record = readArchive(archive, values["expected-sha256"], safety);
    restoreArchive(record, nodePath.resolve(values.destination));
    receipt = {
      restoreVerified: true,
      sourceTreeSha256: record.manifest.sourceTreeSha256,
      version: 1,
    };
  } else {
    throw new Error("unknown source archive command");
  }
  process.stdout.write(safety.redact(`${JSON.stringify(receipt)}\n`));
} catch (error) {
  process.stderr.write(
    `build-source: ${safety.redact(error instanceof Error ? error.message : "source command failed")}\n`
  );
  process.exitCode = 1;
}
