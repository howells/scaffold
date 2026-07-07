---
title: "Config Snippets"
description: "These are the canonical starting snippets for a new repo."
---

# Config Snippets

These are the canonical starting snippets for a new repo.

Adjust names and filters, but do not casually change the overall contract.

## Root `package.json`

```json
{
  "name": "my-project",
  "private": true,
  "packageManager": "pnpm@11.10.0",
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
    "prepare": "husky"
  },
  "devDependencies": {
    "@howells/lint": "^1.0.0",
    "@howells/typescript-config": "^0.1.6",
    "husky": "9.1.7",
    "lint-staged": "17.0.8",
    "tsx": "^4.22.4",
    "turbo": "2.10.4",
    "typescript": "6.0.3",
    "vitest": "^4.1.8"
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": "howells-fix",
    "*.{json,jsonc,css,md}": "howells-oxfmt --write"
  },
  "engines": {
    "node": ">=24.18.0 <25"
  }
}
```

Notes:

- replace `web` with the primary app package when needed
- if `test` is expensive, keep `check` light and create a heavier CI-only job
- `pnpm@11.10.0` is the current house baseline
- for published packages that can support Node 22, use `"node": ">=22.22.3"` in the package itself while keeping repo tooling on Node 24

## `.node-version`

```text
24.18.0
```

Keep local development, CI, and deployment runtimes on Node 24 LTS. Do not use Node 26 for the house baseline until it reaches LTS.

## Default workspace shape

For a full-stack product repo, start with the core shape:

```text
apps/
  web/
packages/
  db/
  trpc/                   # typed app API layer
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

ignoredBuiltDependencies:
  - esbuild
  - sharp
  - unrs-resolver
```

If the repo genuinely needs extra workspaces such as `scripts/*`, add them explicitly.

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

Only add task-level `env` when a task actually needs it.

## Root `oxlint.config.ts`

For a Next.js monorepo:

```ts
import next from "@howells/lint/oxlint/next";

export default {
  extends: [next],
};
```

For a non-UI or mixed repo, start with `@howells/lint/oxlint/core` or add targeted overrides.

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
  "compilerOptions": {
    "baseUrl": "."
  },
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
    "baseUrl": "."
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

## `.husky/pre-commit`

```sh
pnpm lint-staged
pnpm lint
pnpm typecheck
```

Use this as the default. Only make it heavier when the repo truly needs that pressure.

## `.husky/pre-push`

Optional heavier gate:

```sh
pnpm lint || exit 1
pnpm typecheck || exit 1
pnpm test || exit 1
```

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

Default adapter is `drizzle-orm/neon-http`. The schema lives in `packages/db`; the client is a memoized singleton.

```ts
// packages/db/src/client.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { getDatabaseUrl } from "@your-scope/env";
import * as schema from "./schema";

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getDb = () => {
  cached ??= drizzle(neon(getDatabaseUrl()), { schema });
  return cached;
};
export type Db = ReturnType<typeof getDb>;
```

Use `drizzle-orm/neon-serverless` (`Pool` over WebSockets) instead **only** for runtimes that need interactive/session transactions (long-running workers/CLIs); set `neonConfig.poolQueryViaFetch = true` on edge.

```ts
// drizzle.config.ts
import "dotenv/config"; // or load env via envy before invoking drizzle-kit
import { defineConfig } from "drizzle-kit";
import { getDatabaseUrl } from "./packages/env/src";

export default defineConfig({
  schema: "./packages/db/src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: getDatabaseUrl() },
  strict: true,
  verbose: true,
});
```

Schema-first workflow — `push`, not migration files:

```json
{
  "scripts": {
    "db:push": "envy run local --schema packages/env/src/schema.ts --from .env.local -- drizzle-kit push",
    "db:studio": "envy run local --schema packages/env/src/schema.ts --from .env.local -- drizzle-kit studio"
  }
}
```

## Minimal `AGENTS.md`

```md
# Project Instructions

- Continually explain what you are doing, especially with long and complex tasks.
- Prefer `rg` for search.
- Use `apply_patch` for file edits.
- Never add generic starter code when project-local patterns already exist.
```

Keep this short. It should constrain agent behavior, not restate your whole engineering philosophy.
