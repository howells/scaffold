import { z } from "zod";

export const digestSchema = z.string().regex(/^[a-f0-9]{64}$/u);
const mode = z.number().int().min(0).max(0o777);
const fileEntrySchema = z.strictObject({
  mode,
  path: z.string(),
  sha256: digestSchema,
  size: z.number().int().nonnegative(),
  type: z.literal("file"),
});
const entrySchema = z.discriminatedUnion("type", [
  fileEntrySchema,
  z.strictObject({ mode, path: z.string(), type: z.literal("directory") }),
  z.strictObject({
    path: z.string(),
    target: z.string(),
    type: z.literal("symlink"),
  }),
]);
export type SourceEntry = z.infer<typeof entrySchema>;
export const sourceSchema = z.strictObject({
  baseCommit: z.string().regex(/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u),
  entries: z.array(entrySchema),
  exclusions: z.array(
    z.strictObject({ pattern: z.string(), reason: z.string() })
  ),
  includes: z.array(z.string()),
  sourceTreeSha256: digestSchema,
  trackedChanges: z.string(),
});
export type SourceTree = z.infer<typeof sourceSchema>;
export interface SourceSnapshot {
  contents: Record<string, string>;
  source: SourceTree;
}
export const manifestSchema = sourceSchema.extend({
  buildConfig: z
    .strictObject({ path: z.string(), sha256: digestSchema })
    .nullable(),
  lockfiles: z.array(fileEntrySchema).min(1),
  secretEnvironmentNames: z.array(z.string()),
  toolchain: z.strictObject({
    arch: z.string(),
    engines: z.record(z.string(), z.string()),
    node: z.string(),
    packageManager: z.string(),
    packageManagerVersion: z.string(),
    platform: z.string(),
  }),
});
export type SourceManifest = z.infer<typeof manifestSchema>;
export const archiveSchema = z.strictObject({
  contents: z.record(z.string(), z.string()),
  format: z.literal("howells-build-source"),
  manifest: manifestSchema,
  version: z.literal(1),
});
export type SourceArchive = z.infer<typeof archiveSchema>;
export const jsonSchema = z.json();
export type JsonValue = z.infer<typeof jsonSchema>;
export const jsonValue = (text: string): JsonValue =>
  jsonSchema.parse(JSON.parse(text));
export const missingFileSchema = z.object({ code: z.literal("ENOENT") });
