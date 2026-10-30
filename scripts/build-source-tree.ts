import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstatSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
} from "node:fs";
import nodePath from "node:path";

import {
  exclusionReason,
  exclusions,
  sourcePath,
  validateLinks,
} from "./build-source-safety.ts";
import type { SourceSafety } from "./build-source-safety.ts";
import { missingFileSchema } from "./build-source-schema.ts";
import type { SourceEntry, SourceSnapshot } from "./build-source-schema.ts";

export const sha256 = (bytes: string | Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
export const treeDigest = (entries: SourceEntry[]) =>
  sha256(
    JSON.stringify(
      entries.map((entry) => {
        if (entry.type === "file") {
          return [entry.path, entry.type, entry.mode, entry.size, entry.sha256];
        }
        if (entry.type === "directory") {
          return [entry.path, entry.type, entry.mode];
        }
        return [entry.path, entry.type, entry.target];
      })
    )
  );
export const comparePaths = (left: string, right: string) =>
  left < right ? -1 : Number(left > right);

const ensureParents = (root: string, input: string) => {
  for (
    let parent = nodePath.dirname(input);
    parent !== ".";
    parent = nodePath.dirname(parent)
  ) {
    if (!lstatSync(nodePath.join(root, parent)).isDirectory()) {
      throw new Error(`unsafe source ancestor: ${input}`);
    }
  }
};

const sourceGit = (root: string) => {
  const git = (...args: string[]) =>
    execFileSync("git", ["--no-optional-locks", ...args], {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trimEnd();
  if (
    realpathSync(git("rev-parse", "--show-toplevel")) !== realpathSync(root)
  ) {
    throw new Error("--repo must name the Git checkout root");
  }
  if (
    git("ls-files", "--stage", "-z")
      .split("\0")
      .some((entry) => entry.startsWith("160000 "))
  ) {
    throw new Error(
      "unsupported required input: Git submodule; its source needs a separate capture"
    );
  }
  return git;
};

export const sourceTree = (
  root: string,
  includes: string[],
  safety: SourceSafety,
  buildConfig?: string
): SourceSnapshot => {
  const git = sourceGit(root);
  const tracked = new Set(
    git("ls-files", "--cached", "-z").split("\0").filter(Boolean)
  );
  const paths = new Set<string>();
  for (const path of git(
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z"
  )
    .split("\0")
    .filter(Boolean)) {
    sourcePath(path);
    const reason = exclusionReason(path, buildConfig);
    if (reason !== null && tracked.has(path)) {
      throw new Error(`unsafe required input: ${path}; ${reason}`);
    }
    if (reason === null) {
      paths.add(path);
    }
  }
  const addInput = (input: string) => {
    sourcePath(input);
    const reason = exclusionReason(input, buildConfig);
    if (reason !== null) {
      throw new Error(`unsafe required input: ${input}; ${reason}`);
    }
    let stat;
    try {
      ensureParents(root, input);
      stat = lstatSync(nodePath.join(root, input));
    } catch (error) {
      if (missingFileSchema.safeParse(error).success) {
        throw new Error(`missing required input: ${input}`, { cause: error });
      }
      throw error;
    }
    paths.add(input);
    if (stat.isDirectory()) {
      for (const name of readdirSync(nodePath.join(root, input))) {
        addInput(`${input}/${name}`);
      }
    }
  };
  for (const path of includes) {
    addInput(path);
  }
  for (const input of paths) {
    for (
      let parent = nodePath.dirname(input);
      parent !== ".";
      parent = nodePath.dirname(parent)
    ) {
      paths.add(parent);
    }
  }
  const entries: SourceEntry[] = [];
  const contents = new Map<string, string>();
  for (const input of [...paths].toSorted(comparePaths)) {
    let stat;
    try {
      ensureParents(root, input);
      stat = lstatSync(nodePath.join(root, input));
    } catch (error) {
      if (missingFileSchema.safeParse(error).success) {
        continue;
      }
      throw error;
    }
    if (stat.isSymbolicLink()) {
      entries.push({
        path: input,
        target: readlinkSync(nodePath.join(root, input)),
        type: "symlink",
      });
    } else if (stat.isFile()) {
      const data = readFileSync(nodePath.join(root, input));
      safety.check(data, input);
      entries.push({
        mode: stat.mode % 0o1000,
        path: input,
        sha256: sha256(data),
        size: data.length,
        type: "file",
      });
      contents.set(input, data.toString("base64"));
    } else if (stat.isDirectory()) {
      entries.push({
        mode: stat.mode % 0o1000,
        path: input,
        type: "directory",
      });
    } else {
      throw new Error(`unsupported source input: ${input}`);
    }
  }
  validateLinks(entries);
  const source = {
    baseCommit: git("rev-parse", "HEAD"),
    entries,
    exclusions,
    includes,
    sourceTreeSha256: treeDigest(entries),
    trackedChanges: git("diff", "--name-status", "--no-renames", "HEAD", "--"),
  };
  return { contents: Object.fromEntries(contents), source };
};
