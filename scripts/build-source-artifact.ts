import { createHash } from "node:crypto";
import {
  closeSync,
  lstatSync,
  openSync,
  readSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  statSync,
} from "node:fs";
import nodePath from "node:path";

const fileDigest = (path: string) => {
  const hash = createHash("sha256");
  const descriptor = openSync(path, "r");
  const buffer = Buffer.alloc(1024 * 1024);
  try {
    let size;
    while ((size = readSync(descriptor, buffer)) !== 0) {
      hash.update(buffer.subarray(0, size));
    }
  } finally {
    closeSync(descriptor);
  }
  return hash.digest("hex");
};

export const artifactDigest = (root: string) => {
  const hash = createHash("sha256");
  const walk = (relative: string, ancestors: Set<string>) => {
    const path = nodePath.join(root, relative);
    const link = lstatSync(path);
    if (link.isSymbolicLink()) {
      hash.update(JSON.stringify([relative, "symlink", readlinkSync(path)]));
    }
    const stat = statSync(path);
    if (stat.isFile()) {
      hash.update(
        JSON.stringify([
          relative,
          "file",
          stat.mode % 0o1000,
          stat.size,
          fileDigest(path),
        ])
      );
    } else if (stat.isDirectory()) {
      const resolved = realpathSync(path);
      if (ancestors.has(resolved)) {
        throw new Error(`cyclic artifact directory: ${relative}`);
      }
      const parents = new Set([...ancestors, resolved]);
      hash.update(JSON.stringify([relative, "directory", stat.mode % 0o1000]));
      for (const name of readdirSync(path).toSorted()) {
        walk(nodePath.join(relative, name), parents);
      }
    } else {
      throw new Error(`unsupported artifact input: ${relative}`);
    }
  };
  walk("", new Set());
  return hash.digest("hex");
};
