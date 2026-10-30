import { execFileSync } from "node:child_process";

import { z } from "zod";

import type { SourceSafety } from "./build-source-safety.ts";
import { jsonValue, manifestSchema } from "./build-source-schema.ts";
import type { SourceManifest } from "./build-source-schema.ts";
import type { sourceTree } from "./build-source-tree.ts";

export const sourceManifest = (
  root: string,
  snapshot: ReturnType<typeof sourceTree>,
  safety: SourceSafety,
  configPath?: string
): SourceManifest => {
  const { source, contents } = snapshot;
  let decoded: unknown;
  try {
    const content = contents["package.json"];
    if (content === undefined) {
      throw new Error("package.json is not captured");
    }
    decoded = jsonValue(Buffer.from(content, "base64").toString());
  } catch (error) {
    throw new Error("missing or invalid required package.json", {
      cause: error,
    });
  }
  const parsed = z
    .object({
      engines: z.record(z.string(), z.string()).default({}),
      packageManager: z.string(),
    })
    .safeParse(decoded);
  if (!parsed.success) {
    throw new Error("missing or invalid packageManager in package.json");
  }
  const packageJson = parsed.data;
  const pin = /^pnpm@(?<version>\d+\.\d+\.\d+)(?:\+sha\d+\..+)?$/u.exec(
    packageJson.packageManager
  )?.groups?.version;
  if (pin === undefined) {
    throw new Error("source capture requires a pinned pnpm packageManager");
  }
  const lockfiles = source.entries.filter(
    (entry) =>
      /(?:^|\/)pnpm-lock\.yaml$/u.test(entry.path) && entry.type === "file"
  );
  if (!lockfiles.some((entry) => entry.path === "pnpm-lock.yaml")) {
    throw new Error("missing required dependency lock: pnpm-lock.yaml");
  }
  let packageManagerVersion;
  try {
    packageManagerVersion = execFileSync("pnpm", ["--version"], {
      cwd: root,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    throw new Error("cannot identify the installed pnpm toolchain");
  }
  if (packageManagerVersion !== pin) {
    throw new Error("installed pnpm does not match packageManager");
  }
  const configuration =
    configPath === undefined
      ? null
      : source.entries.find(
          (entry) => entry.path === configPath && entry.type === "file"
        );
  if (configPath !== undefined && configuration === undefined) {
    throw new Error(`missing required build configuration: ${configPath}`);
  }
  return manifestSchema.parse({
    ...source,
    buildConfig:
      configuration?.type === "file"
        ? { path: configPath, sha256: configuration.sha256 }
        : null,
    lockfiles,
    secretEnvironmentNames: safety.secretEnvironmentNames,
    toolchain: {
      arch: process.arch,
      engines: packageJson.engines,
      node: process.version,
      packageManager: packageJson.packageManager,
      packageManagerVersion,
      platform: process.platform,
    },
  });
};
