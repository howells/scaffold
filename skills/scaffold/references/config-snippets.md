# Config snippets

Adjust names and filters while preserving the script and workspace contracts.

## Root `package.json`

```json
{
  "name": "my-project",
  "private": true,
  "packageManager": "pnpm@latest",
  "scripts": {
    "dev": "turbo run dev --filter=web",
    "dev:all": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint && howells-workspace-check",
    "lint:fix": "turbo run lint:fix && howells-workspace-fix",
    "format": "howells-fix .",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "check": "pnpm lint && pnpm typecheck && pnpm test",
    "check:affected": "turbo run build lint typecheck test --affected",
    "clean": "turbo run clean --continue=always && rm -rf .turbo",
    "prepare": "howells-husky"
  },
  "devDependencies": {
    "@howells/lint": "latest",
    "@howells/husky": "latest",
    "@howells/typescript-config": "latest",
    "lint-staged": "latest",
    "tsx": "latest",
    "turbo": "latest",
    "typescript": "7.0.2",
    "vitest": "latest"
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": "howells-fix",
    "*.{json,jsonc,css,md,mdx}": "howells-oxfmt --write"
  },
  "engines": {
    "node": ">=24 <25"
  }
}
```

Notes:

- replace `web` with the primary app package when needed
- if `test` is expensive, keep `check` light and create a heavier CI-only job
- `pnpm` is the current house baseline
- for published packages that can support Node 22, use `"node": ">=22"` in the package itself while keeping repo tooling on Node 24

## `.node-version`

```text
24
```

Keep local development, CI, and deployment runtimes on Node 24 LTS. Do not use Node 26 for the house baseline until it reaches LTS.

## Default workspace shape

For a full-stack product repo, start with the core shape:

```text
apps/
  web/
packages/
  db/
  trpc/                   # optional: same-workspace typed API
  ui/
  typescript-config/
  tailwind-config/
  env/                    # when typed env is centralized
  motion/                 # when motion tokens/presets are shared
```

Add capability packages only when the repo needs them:

```text
apps/
  storybook/              # when shared UI exists
packages/
  auth/                   # when auth is shared
  ai/                     # only for repo-specific logic above @howells/ai
  mastra/                 # when Mastra owns agent/workflow runtime behavior
  agents/                 # when non-Mastra agent behavior is shared
  mcp/                    # when the repo exposes MCP tools or resources
  assets/                 # when assets are shared
  upload/                 # only if the repo has real upload/media behavior
```

This is a starting shape, not a checklist. Do not create empty packages just to satisfy either diagram.

## `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"

minimumReleaseAge: 1440
minimumReleaseAgeExclude:
  - "@howells/*"

allowBuilds:
  esbuild: true
  sharp: true

catalog:
  typescript: "7.0.2"
```

Add extra workspaces such as `scripts/*` explicitly. Keep private-package cooldown exclusions exact, review each lifecycle build entry, and pin catalog versions in the consuming repo.

## Root `turbo.json`

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "stream",
  "globalDependencies": ["**/.env", "**/.env.local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**", "build/**"],
      "cache": false
    },
    "dev": {
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "cache": false,
      "persistent": true
    },
    "start": {
      "dependsOn": ["build"],
      "cache": false,
      "persistent": true
    },
    "lint": {
      "cache": false
    },
    "lint:fix": {
      "cache": false
    },
    "typecheck": {
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**", "playwright-report/**", "test-results/**"],
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
```

Add task-level `env` only when the task reads it.

## Root `oxlint.config.ts`

For a Next.js monorepo:

```ts
import next from "@howells/lint/oxlint/next";

export default {
  extends: [next],
};
```

For a non-UI or mixed repo, start with `@howells/lint/oxlint/core` or add targeted overrides.

Every package that lints carries its own `oxlint.config.ts` extending the closest preset (`core`, `react` or `next`), and the file is spelled `.ts`. Oxlint reads only `oxlint.config.ts` and `oxlint.config.mts`. A config named `.mjs`, `.js`, `.cjs` or `.json` is never read, the run is quiet and it exits 0. MaterialGraph and five sibling repos linted on Oxlint's defaults for months that way, and a repo that depends on `@howells/lint` with no config at all looks identical from outside.

The preset ships as ultracite ships it: no config-level rule disposals, no compat shim, no old version aliased under another name. Verify a fresh setup by reading the rule names in the first `pnpm lint` run - `anti-slop(...)` and `unicorn(...)` present means the preset loaded. A large first-load backlog is held with a ratchet against a committed baseline, so the count can only fall. The `howells-lint` skill carries the sweep and the fixer.

## Root `oxfmt.config.ts`

```ts
import howells from "@howells/lint/oxfmt";

export default howells;
```

## Root `tsconfig.json`

For a UI-oriented monorepo root:

```json
{
  "extends": "@howells/typescript-config/bundler-dom-app",
  "exclude": [
    "node_modules",
    "**/node_modules",
    "**/.next",
    "**/dist",
    "**/storybook-static"
  ]
}
```

For a Next.js app leaf:

```json
{
  "extends": "@howells/typescript-config/nextjs",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

For a React library leaf:

```json
{
  "extends": "@howells/typescript-config/react-library",
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

For a non-DOM package:

```json
{
  "extends": "@howells/typescript-config/bundler-no-dom-library-monorepo",
  "include": ["src/**/*.ts"]
}
```

## `components.json` for UI repos

Use this when the repo owns a local shared UI package seeded from the bundled UI baseline:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "packages/tailwind-config/shared-styles.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "packages/ui/src/components",
    "utils": "packages/ui/src/lib",
    "ui": "packages/ui/src/components",
    "lib": "packages/ui/src/lib"
  }
}
```

If the repo has its own local UI package, keep aliases aligned to that package rather than scattering local component paths across apps.

## Git hooks

`@howells/husky` writes the immutable `.husky/pre-commit` and `.husky/pre-push` files during `prepare`. Don't hand-edit the generated hooks in a consumer repository. Pre-commit runs `lint-staged`; pre-push runs `typecheck` and `lint` when the pushed ref is the checked-out `HEAD`.

## Claude Code hooks: `.claude/settings.json`

Commit this, merged into any existing settings. It formats only the file an `Edit` or `Write` touched. It `cd`s into the file's directory so `howells-oxfmt` picks up the nearest package's config, and calls the binary through `$CLAUDE_PROJECT_DIR` because the hook runs wherever the session last changed directory. Needs `jq`. Repos still on Biome call `biome format --write` in the same place, never `check --fix`. `stack-decisions.md` explains why there is no Stop hook, no lint fix and no Codex hook.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "f=$(jq -r '.tool_input.file_path // empty'); [ -f \"$f\" ] || exit 0; case \"$f\" in *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs|*.mts|*.cts|*.json|*.jsonc|*.css|*.md|*.mdx) cd \"$(dirname \"$f\")\" && \"$CLAUDE_PROJECT_DIR/node_modules/.bin/howells-oxfmt\" --write \"$f\" >/dev/null ;; esac"
          }
        ]
      }
    ]
  }
}
```

### Staging is format-only, always

`lint-staged` runs one glob and one command:

```json
"lint-staged": {
  "*.{js,ts,jsx,tsx,json,jsonc,css,md,mdx}": "howells-oxfmt --write"
}
```

Never `howells-fix`. It applies every autofix Oxlint offers, and four of those change what a test asserts:

```
expect(x).toEqual(y)   ->  toStrictEqual(y)
expect(x).toBe(true)   ->  toBeTruthy()
expect(x).toBe(false)  ->  toBeFalsy()
describe("name", ...)  ->  describe(name, ...)
```

The two truthiness rewrites weaken the assertion. A test written to check a value is exactly true starts passing for any truthy value, and it happens on commit, to staged files, with nothing in the output saying so. Measured on 2026-09-16: colorscope carried 276 assertions weakened this way and motif 121, 39 of motif's arriving in a single session's commits, one of which broke an env test.

`howells-fix` also exits 1 on any finding it cannot repair, so in a repo with a lint backlog it failed every commit that staged an affected file, leaving `--no-verify` as the only route out, which disables every hook at once.

Lint still gates on push, where a person reads the findings and decides. Biome repos use `biome format --write`, never `check --write`.

### A lint backlog gets a ratchet, not an exemption

A repo whose `lint` script reports more than roughly 40 findings still adopts the hooks - it does not skip them. Its `lint` script becomes a ratchet instead of a bare `howells-check`:

- Copy `scripts/check-lint-baseline.mjs` from a repo that already carries it (originally MaterialGraph's). It re-runs everything the repo's own lint script ran, compares Oxlint error counts per unit and per rule against a checked-in `scripts/lint-baseline.json`, and fails only when a count rises above its baseline. Formatting is never baselined - it must still pass outright.
- Wire `"lint": "node scripts/check-lint-baseline.mjs"` and keep the unratcheted run as `"lint:all"`.
- Generate the baseline with `node scripts/check-lint-baseline.mjs --update`, and record in the commit message how many findings it recorded and the top rules by count.
- Prove the ratchet actually bites before shipping it: temporarily lower one baselined count, confirm the gate fails, then restore it.

The backlog can then only fall, and the push gate is real from the first commit rather than deferred until the backlog is clear.

Generate the baseline against the same tree CI lints. Type-aware rules read generated type declarations, so if a repo generates any (Fumadocs writes `.source/`, Prisma writes a client), a baseline recorded on a machine that already has them will be far too low on a fresh runner: every import from the missing directory resolves to `any` and `no-unsafe-*` floods. Make the `lint` script generate them first, the way `typecheck` already does, rather than baselining the degraded numbers. Prove it by deleting the generated directory and running `lint` before you push.

## Envy env boundary

Use this shape for repos with runtime env:

```ts
// packages/env/src/schema.ts
import { defineEnv, v } from "@howells/envy";
import { z } from "zod";

export const envSchema = defineEnv({
  server: {
    DATABASE_URL: v(z.url()),
  },
  public: {
    NEXT_PUBLIC_APP_URL: v(z.url()),
  },
});
```

```json
{
  "scripts": {
    "env:check": "envy check local --schema packages/env/src/schema.ts",
    "check": "pnpm lint && pnpm typecheck && pnpm test && pnpm env:check"
  }
}
```

For provider checks, prefer Envy's Vercel or Railway adapters over hand-written shell scripts.

## Drizzle + Neon db client

Use `@howells/neon` — it carries the fleet's hardening (write-safe retries, IPv4-first DNS, cold-start timeouts, HMR-safe caching, endpoint guards) so repos never hand-roll clients. The schema lives in `packages/db`. Full rationale: [Neon](./neon.md).

```ts
// packages/db/src/client.ts
import { createHttpDb } from "@howells/neon/http";
import { getDatabaseUrl } from "@your-scope/env"; // pooled DATABASE_URL

import * as schema from "./schema";

export const db = createHttpDb({ schema, url: getDatabaseUrl() });
export type Db = typeof db;
```

Need interactive/session transactions (`db.transaction(async (tx) => ...)`), `LISTEN/NOTIFY`, or a long-running worker? Swap the subpath — `createPooledDb` from `@howells/neon/pool` (hardened `pg`, same call shape). Never `drizzle-orm/neon-serverless`; enforce with `createOxlintConfig()` from `@howells/neon/lint`.

```ts
// drizzle.config.ts — asserts the DIRECT (non-pooler) endpoint
import { neonKitConfig } from "@howells/neon/kit";

export default neonKitConfig({
  directUrl: process.env.DIRECT_DATABASE_URL ?? "",
  schema: "./packages/db/src/schema.ts",
});
```

Local or disposable database workflow:

```json
{
  "scripts": {
    "db:push": "envy run local --schema packages/env/src/schema.ts --from .env.local -- drizzle-kit push",
    "db:studio": "envy run local --schema packages/env/src/schema.ts --from .env.local -- drizzle-kit studio"
  }
}
```

For production or valuable data, replace `db:push` with an owned migration command and runbook: explicit target, checked-in reviewed migration, backup or repair path, pre/post schema verification, and a smoke test. Keep `db:push` out of production deployment scripts.

## Minimal `AGENTS.md`

```md
# Project instructions

- Continually explain what you are doing, especially with long and complex tasks.
- Prefer `rg` for search.
- Use `apply_patch` for file edits.
- Never add generic starter code when project-local patterns already exist.
```

Keep it short and operational.
