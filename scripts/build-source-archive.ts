import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";

import {
  exclusionReason,
  sourcePath,
  validateLinks,
} from "./build-source-safety.ts";
import type { SourceSafety } from "./build-source-safety.ts";
import { archiveSchema, jsonValue } from "./build-source-schema.ts";
import type { SourceArchive, SourceManifest } from "./build-source-schema.ts";
import { sha256, treeDigest } from "./build-source-tree.ts";

export const encodeArchive = (
  manifest: SourceManifest,
  contents: Record<string, string>
) =>
  gzipSync(
    JSON.stringify({
      contents,
      format: "howells-build-source",
      manifest,
      version: 1,
    })
  );

const validateManifest = (record: SourceArchive) => {
  const { manifest, contents } = record;
  for (const input of manifest.includes) {
    sourcePath(input);
  }
  const seen = new Set<string>();
  for (const entry of manifest.entries) {
    sourcePath(entry.path);
    if (seen.has(entry.path)) {
      throw new Error(`duplicate archive path: ${entry.path}`);
    }
    seen.add(entry.path);
    if (
      entry.type !== "directory" &&
      exclusionReason(entry.path, manifest.buildConfig?.path) !== null
    ) {
      throw new Error(`unsafe archive input: ${entry.path}`);
    }
  }
  const filePaths = new Set(
    manifest.entries
      .filter((entry) => entry.type === "file")
      .map((entry) => entry.path)
  );
  if (Object.keys(contents).some((input) => !filePaths.has(input))) {
    throw new Error("unexpected archive content");
  }
  validateLinks(manifest.entries);
};

export const readArchive = (
  archive: string,
  expectedSha256: string | undefined,
  safety: SourceSafety
): SourceArchive => {
  const data = readFileSync(archive);
  if (
    !/^[a-f0-9]{64}$/u.test(expectedSha256 ?? "") ||
    sha256(data) !== expectedSha256
  ) {
    throw new Error(
      "archive SHA-256 does not match the trusted capture receipt"
    );
  }
  let decoded: unknown;
  try {
    decoded = jsonValue(
      gunzipSync(data, { maxOutputLength: 512 * 1024 * 1024 }).toString()
    );
  } catch (error) {
    throw new Error("invalid or oversized source archive", { cause: error });
  }
  const parsed = archiveSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new Error("invalid or unsupported source archive schema");
  }
  const record = parsed.data;
  validateManifest(record);
  if (
    treeDigest(record.manifest.entries) !== record.manifest.sourceTreeSha256
  ) {
    throw new Error("source-tree digest does not match the manifest");
  }
  for (const entry of record.manifest.entries) {
    if (entry.type !== "file") {
      continue;
    }
    const content = record.contents[entry.path];
    if (content === undefined) {
      throw new Error(`missing archive content: ${entry.path}`);
    }
    const bytes = Buffer.from(content, "base64");
    if (
      bytes.toString("base64") !== content ||
      bytes.length !== entry.size ||
      sha256(bytes) !== entry.sha256
    ) {
      throw new Error(`archive content digest mismatch: ${entry.path}`);
    }
    safety.check(bytes, entry.path);
  }
  safety.check(Buffer.from(JSON.stringify(record.manifest)), "source manifest");
  return record;
};

export const restoreArchive = (record: SourceArchive, destination: string) => {
  mkdirSync(destination, { mode: 0o700 });
  for (const entry of record.manifest.entries) {
    const target = path.join(destination, entry.path);
    mkdirSync(path.dirname(target), { mode: 0o700, recursive: true });
    if (entry.type === "directory") {
      mkdirSync(target, { mode: 0o700, recursive: true });
    } else if (entry.type === "symlink") {
      symlinkSync(entry.target, target);
    } else {
      const content = record.contents[entry.path];
      if (content === undefined) {
        throw new Error(`missing archive content: ${entry.path}`);
      }
      writeFileSync(target, Buffer.from(content, "base64"), {
        flag: "wx",
        mode: entry.mode,
      });
      chmodSync(target, entry.mode);
    }
  }
  for (const entry of record.manifest.entries.toReversed()) {
    if (entry.type === "directory") {
      chmodSync(path.join(destination, entry.path), entry.mode);
    }
  }
  const entries = record.manifest.entries.map((entry) => {
    const target = path.join(destination, entry.path);
    if (entry.type === "symlink") {
      if (!lstatSync(target).isSymbolicLink()) {
        throw new Error(`restored symlink mismatch: ${entry.path}`);
      }
      realpathSync(target);
      return { ...entry, target: readlinkSync(target) };
    }
    if (entry.type === "directory") {
      return { ...entry, mode: lstatSync(target).mode % 0o1000 };
    }
    const bytes = readFileSync(target);
    return {
      ...entry,
      mode: lstatSync(target).mode % 0o1000,
      sha256: sha256(bytes),
      size: bytes.length,
    };
  });
  if (treeDigest(entries) !== record.manifest.sourceTreeSha256) {
    throw new Error("restored source-tree digest mismatch");
  }
};
