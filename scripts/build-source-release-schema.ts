import { z } from "zod";

import { digestSchema } from "./build-source-schema.ts";
import type { JsonValue } from "./build-source-schema.ts";

export const deploymentSchema = z.strictObject({
  id: z.string().regex(/^dpl_[a-zA-Z0-9]+$/u),
  url: z.string().regex(/^https:\/\/[a-z0-9-]+\.vercel\.app$/u),
});
export const releaseSchema = z.strictObject({
  artifact: z.strictObject({ path: z.string(), sha256: digestSchema }),
  checks: z.strictObject({
    acceptance: z.boolean(),
    ready: z.boolean(),
    revision: z.boolean(),
  }),
  deployment: deploymentSchema.nullable(),
  format: z.literal("howells-manual-release"),
  source: z.strictObject({
    archive: z.string(),
    archiveSha256: digestSchema,
    baseCommit: z.string().regex(/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/u),
    restoreVerified: z.literal(true),
    sourceTreeSha256: digestSchema,
  }),
  status: z.enum([
    "prebuilt-verified",
    "deployment-verified",
    "promoted",
    "failed",
  ]),
  verification: z.strictObject({
    artifact: z.literal("local-prebuilt-output-tree-sha256"),
    deterministicRebuild: z.literal("not-verified"),
    providerPackaging: z.literal("not-verified"),
    source: z.literal("archive-integrity-and-restored-source-tree"),
  }),
  version: z.literal(1),
});
export type Release = z.infer<typeof releaseSchema>;

export const inspectedIdentity = (
  value: JsonValue,
  expectedUrl: string,
  expectedId?: string
) => {
  const parsed = z
    .object({
      id: deploymentSchema.shape.id,
      url: z.string().regex(/^(?:https:\/\/)?[a-z0-9-]+\.vercel\.app$/u),
    })
    .safeParse(value);
  if (!parsed.success) {
    throw new Error("incomplete immutable deployment identity");
  }
  const url = parsed.data.url.startsWith("https://")
    ? parsed.data.url
    : `https://${parsed.data.url}`;
  if (
    url !== expectedUrl ||
    (expectedId !== undefined && parsed.data.id !== expectedId)
  ) {
    throw new Error("inconsistent immutable deployment identity");
  }
  return deploymentSchema.parse({ id: parsed.data.id, url });
};
