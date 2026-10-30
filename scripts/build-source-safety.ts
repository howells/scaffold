import nodePath from "node:path";
import { env as environment } from "node:process";

import { z } from "zod";

import { jsonSchema, jsonValue } from "./build-source-schema.ts";
import type { JsonValue, SourceEntry } from "./build-source-schema.ts";

export const exclusions = [
  { pattern: "**/.git/**", reason: "Git administration is not build source" },
  {
    pattern: "**/.env*",
    reason:
      "external environment values; example files may contain placeholders only",
  },
  {
    pattern:
      "**/{.ssh,.aws,.gnupg}/**; **/{.netrc,id_rsa,id_ed25519}; **/*.{pem,key,p12,pfx}",
    reason: "credential files",
  },
  {
    pattern: "**/node_modules/**",
    reason: "installed dependencies are restored from captured locks",
  },
  {
    pattern: "**/{.next,.vercel,out,dist,coverage}/**",
    reason:
      "build outputs and provider state; only declared build configuration is included",
  },
  {
    pattern: "Git-ignored paths",
    reason:
      "excluded unless explicitly required with --include or --build-config",
  },
];
const secretName =
  /(?:TOKEN|SECRET|PASSWORD|PASSWD|PRIVATE_KEY|API_KEY|ACCESS_KEY|DATABASE_URL|DIRECT_URL|AUTHORIZATION|COOKIE)/iu;
const credential =
  /-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----|\blin_api_[a-z0-9]{20,}|\b(?:gh[pousr]_|github_pat_)[a-z0-9_]{20,}|\bsk-[a-z0-9_-]{20,}|\bxox[baprs]-[a-z0-9-]{15,}|\bAKIA[A-Z0-9]{16}\b|[a-z][a-z0-9+.-]*:\/\/[^\s/:]+:[^\s/@]+@/iu;
const placeholder = (value: JsonValue) => {
  const text = z.string().safeParse(value);
  return (
    text.success &&
    /^(?:\$\{[A-Z_][A-Z0-9_]*\}|\$[A-Z_][A-Z0-9_]*|<[A-Z_ -]+>|REPLACE_ME)$/u.test(
      text.data
    )
  );
};
const sensitiveField = (name: string) =>
  secretName.test(
    name.replaceAll(/(?<lower>[a-z])(?<upper>[A-Z])/gu, "$<lower>_$<upper>")
  );
const containsCredential = (value: JsonValue): boolean => {
  const array = z.array(jsonSchema).safeParse(value);
  if (array.success) {
    return array.data.some(containsCredential);
  }
  const object = z.record(z.string(), jsonSchema).safeParse(value);
  if (!object.success) {
    return false;
  }
  return Object.entries(object.data).some(
    ([key, child]) =>
      containsCredential(child) ||
      (sensitiveField(key) &&
        child !== "" &&
        child !== null &&
        !placeholder(child))
  );
};
const unsafeCharacters = (value: string) =>
  value.includes("\\") || /\p{Cc}/u.test(value);

export const sourcePath = (path: string): string => {
  if (
    path === "" ||
    nodePath.isAbsolute(path) ||
    path !== nodePath.posix.normalize(path) ||
    path.split("/").some((part) => part === ".." || part === ".git") ||
    unsafeCharacters(path) ||
    path === "."
  ) {
    throw new Error("unsafe source path");
  }
  return path;
};

export const exclusionReason = (path: string, buildConfig?: string) => {
  const parts = path.split("/");
  if (
    parts.some(
      (part) =>
        /^\.env(?:\.|$)/u.test(part) &&
        !/^\.env\.(?:example|sample|template)$/u.test(part)
    )
  ) {
    return "secret environment file";
  }
  if (
    parts.some((part) =>
      /^(?:\.ssh|\.aws|\.gnupg|\.netrc|id_rsa|id_ed25519)$/u.test(part)
    ) ||
    /\.(?:pem|key|p12|pfx)$/iu.test(path)
  ) {
    return "credential file";
  }
  if (parts.includes("node_modules")) {
    return "installed dependencies";
  }
  if (
    parts.some((part) => [".next", "out", "dist", "coverage"].includes(part))
  ) {
    return "build output";
  }
  if (parts.includes(".vercel") && path !== buildConfig) {
    return "provider state or build output";
  }
  return null;
};

export const validateLinks = (entries: SourceEntry[]) => {
  const paths = new Map(
    entries.map((entry) => [sourcePath(entry.path), entry])
  );
  const resolveTarget = (path: string, visited: Set<string>): string => {
    if (path !== ".") {
      sourcePath(path);
    }
    const parts = path.split("/");
    for (let index = 1; index <= parts.length; index += 1) {
      const prefix = parts.slice(0, index).join("/");
      const entry = paths.get(prefix);
      if (entry?.type !== "symlink") {
        continue;
      }
      if (
        visited.has(prefix) ||
        nodePath.isAbsolute(entry.target) ||
        unsafeCharacters(entry.target)
      ) {
        throw new Error("unsafe source symlink");
      }
      return resolveTarget(
        nodePath.posix.join(
          nodePath.posix.dirname(prefix),
          entry.target,
          ...parts.slice(index)
        ),
        new Set([...visited, prefix])
      );
    }
    if (path !== "." && !paths.has(path)) {
      throw new Error("symlink target is not captured");
    }
    return path;
  };
  for (const entry of entries) {
    for (
      let parent = nodePath.posix.dirname(entry.path);
      parent !== ".";
      parent = nodePath.posix.dirname(parent)
    ) {
      if (paths.get(parent)?.type !== "directory") {
        throw new Error("unsafe source ancestor");
      }
    }
    if (entry.type === "symlink") {
      try {
        resolveTarget(entry.path, new Set());
      } catch (error) {
        throw new Error(`unsafe or uncaptured source symlink: ${entry.path}`, {
          cause: error,
        });
      }
    }
  }
};

export const sourceSafety = (declaredNames: string[] = []) => {
  if (declaredNames.some((name) => !/^[A-Z_][A-Z0-9_]*$/u.test(name))) {
    throw new Error("invalid secret environment name");
  }
  const secretEnvironmentNames = [
    ...new Set([
      ...Object.keys(environment).filter((name) => secretName.test(name)),
      ...declaredNames,
    ]),
  ].toSorted((left, right) => left.localeCompare(right));
  const secrets = secretEnvironmentNames
    .map((name) => environment[name])
    .filter((value): value is string => value !== undefined && value !== "");
  const redact = (text: string) => {
    let redacted = text;
    for (const secret of secrets) {
      redacted = redacted.replaceAll(secret, "[redacted]");
    }
    return redacted;
  };
  const check = (bytes: Buffer, path: string) => {
    const text = bytes.toString();
    let configurationCredential = false;
    if (path.endsWith(".json")) {
      let parsed: JsonValue;
      try {
        parsed = jsonValue(text);
      } catch (error) {
        throw new Error(`invalid JSON input: ${path}`, { cause: error });
      }
      configurationCredential = containsCredential(parsed);
    }
    if (path.endsWith(".npmrc")) {
      configurationCredential = text.split(/\r?\n/u).some((line) => {
        const match = /^\s*(?<name>[^#;=]+)=\s*(?<value>.*?)\s*$/u.exec(
          line
        )?.groups;
        return (
          match !== undefined &&
          sensitiveField(match.name ?? "") &&
          match.value !== undefined &&
          match.value !== "" &&
          !placeholder(match.value)
        );
      });
    }
    if (
      configurationCredential ||
      credential.test(text) ||
      secrets.some((secret) => text.includes(secret))
    ) {
      throw new Error(
        `unsafe required input: ${path}; credential or secret environment value detected`
      );
    }
  };
  return { check, redact, secretEnvironmentNames };
};
export type SourceSafety = ReturnType<typeof sourceSafety>;
