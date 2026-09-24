---
title: "Stack decisions"
description: "The current default stack for new TypeScript product and config work: Next.js, Drizzle, Neon, typed boundaries chosen by consumer shape, and the pinned toolchain."
---

# Stack decisions

These are the current default decisions for new TypeScript product work and shared config repos.

## Core tools

The default toolchain for new TypeScript work:

- **Package manager:** `pnpm`
- **Task runner:** Turborepo
- **Language:** TypeScript
- **Lint and format:** `@howells/lint` (Oxlint / Oxfmt)
- **TypeScript config:** `@howells/typescript-config`
- **Env parsing:** `@howells/envy`
- **Git hooks:** `@howells/husky` with `lint-staged`
- **Runtime:** Node 24 LTS

Shared config packages and each root `package.json` pin exact versions. This page records only major-version policy.

## Current major-version lane

Review this table when a compatibility-significant major changes; keep exact minor and patch versions in workspace catalogs and lockfiles.

| Surface      | Current major for new work | Adopted/reviewed |
| ------------ | -------------------------: | ---------------- |
| Node.js      |                         24 | 2026-08-26       |
| pnpm         |                         11 | 2026-08-26       |
| Next.js      |                         16 | 2026-08-26       |
| React        |                         19 | 2026-08-26       |
| TypeScript   |                          7 | 2026-09-07       |
| Tailwind CSS |                          4 | 2026-08-26       |
| Turborepo    |                          2 | 2026-08-26       |
| Vitest       |                          5 | 2026-09-24       |
| Storybook    |                         10 | 2026-08-26       |
| AI SDK       |                          7 | 2026-08-26       |

For published packages, test every runtime major still claimed in `engines`, even if the new-project lane has moved on. Dropping an existing runtime floor waits for a deliberate package major. Treat persisted classifications, machine-readable output shape, schema meaning, and nullability as compatibility surfaces too: a semantic break may require a major even when function names do not change.

## Package manager

- Use `pnpm`.
- Pin `packageManager` in the root `package.json`.
- Prefer one lockfile at the repo root.
- Put shared dependency versions in the `pnpm-workspace.yaml` catalog.
- Keep pnpm settings, overrides, patches, and lifecycle-build policy in `pnpm-workspace.yaml`, not the ignored `package.json#pnpm` field.
- Explicitly allow or deny dependency build scripts.
- For serious public-facing repos, cool down newly published third-party versions; keep first-party or private exclusions exact and reviewed.
- Test a frozen-lockfile install from a clean checkout in CI.
- Use Node 24 LTS for development, CI, apps, and services.
- Default workspace layout is:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## Node version policy

Use Node 24 LTS as the Howells stack baseline.

Defaults:

- app and service repos: pin `engines.node` to the Node 24 range (`>=24 <25`)
- CI: Node 24
- local version files: pin the latest Node 24 LTS patch
- published packages: keep runtime support back to Node 22 when the package does not need Node 24 APIs, but build and test on Node 24

Do not start new work on Node 20. It is end-of-life. Do not standardize on Node 26 until it reaches LTS.

## Turborepo

Use Turbo as an orchestrator, not as a place to hide complexity.

- Keep `turbo.json` small.
- Keep cache disabled by default.
- Keep `globalDependencies` limited to `.env` files.
- Scope environment variables at the task level, not globally.
- Put package-specific exceptions in leaf packages when needed.
- Avoid deprecated `turbo run --parallel`; let persistent `dev` tasks run through task config.

Active repos keep caching off because stale-cache failures have cost more than slower local runs.

## TypeScript

Use `@howells/typescript-config` and select the leaf preset explicitly:

- Next.js app: `@howells/typescript-config/nextjs`
- Bundler DOM app: `@howells/typescript-config/bundler-dom-app`
- React library: `@howells/typescript-config/react-library`
- Non-DOM app: `@howells/typescript-config/bundler-no-dom-app`
- Non-DOM package: `@howells/typescript-config/bundler-no-dom-library-monorepo` or `tsc-no-dom-library`

Rules:

- do not reintroduce a vague `base.json`
- keep shared presets thin
- keep `paths` in the consumer repo, with targets relative to its config
- remove retired `baseUrl` and obsolete `ignoreDeprecations`
- declare Node, worker and test ambient `types` in their owning leaf configs

Native TypeScript 7 is the default for checking and supported declaration emission. Pin the reviewed stable compiler in the workspace catalog and verify the actual `tsc --version` from each checking package. Preserve the selected preset's target, DOM libraries and emit behavior.

Scripts that import the JavaScript compiler API need a separate TypeScript 6 tooling dependency, such as `@typescript/typescript6`; keep application checking on native 7. Third-party parsers and declaration builders retain their supported compiler resolution until their own compatibility checks pass. Do not use a whole-workspace override to force their compiler version.

## Linting and formatting

Prefer the Oxlint/Oxfmt lane through `@howells/lint`.

Default preset selection:

- non-React or server repo: `@howells/lint/oxlint/core`
- React package: `@howells/lint/oxlint/react`
- Next.js app: `@howells/lint/oxlint/next`
- formatting: `@howells/lint/oxfmt`

Rules:

- avoid repo-local lint wrappers unless the repo has a genuinely unique constraint
- do not install direct `oxlint`, `oxfmt`, Biome, Prettier, or ESLint dependencies in consumer repos
- use `howells-check`, `howells-fix`, `howells-oxlint`, and `howells-oxfmt` instead of raw tool binaries
- prefer inline suppressions over broad config weakening
- keep format and lint behavior consistent across repos

For env access, use `@howells/envy` lint helpers with Oxlint when a repo needs to enforce "no direct `process.env`" strongly.

## Environment variables

Use `@howells/envy` for repos with runtime configuration.

Default approach:

- put the schema in `packages/env`
- parse explicitly by default
- expose separate server and client env modules
- allow direct `process.env` only inside the env boundary
- run local env checks in `pnpm test`
- run Vercel or Railway env checks before deploy

Do not keep hand-written dotenv loading, ad hoc `process.env` reads, or provider env setup scripts once Envy can own that surface.

## Shared Git hooks

Use `@howells/husky` for the standard immutable hook set. It owns Husky and keeps the hook behavior consistent across repositories.

Default approach:

- `prepare`: `howells-husky`
- `pre-commit`: run `lint-staged`
- `pre-push`: run `typecheck` and `lint` when the pushed ref is the checked-out `HEAD`

`lint-staged` runs one glob and one command, `howells-oxfmt --write` over `*.{js,ts,jsx,tsx,json,jsonc,css,md,mdx}`. Staging formats and never lint-fixes. A repo whose lint findings sit above the house threshold (~40) still adopts the hooks: it gets a `lint:ratchet` script running `howells-ratchet` (comparing per-rule Oxlint counts against a checked-in `lint-baseline.json` that can only fall) rather than an exemption, and `prepush` calls that instead of the unratcheted `lint`. See `config-snippets.md` for the exact shapes.

Change the shared package when the house hook contract needs to change. Don't edit generated `.husky` files in consuming repositories.

## Agent hooks

Git hooks are the enforcement layer, because they see every change whichever tool made it: Claude Code, Codex, or a person. Agent hooks only tidy a session.

- **Claude Code:** commit one `PostToolUse` hook, matcher `Edit|Write`, that formats the file just edited and nothing else. The snippet is in `config-snippets.md`. It follows the documented format-after-edit pattern and runs inside subagents too.
- **No lint fixes anywhere automatic.** A lint autofix can change what code means. Four Vitest rules rewrite what a test asserts, and two of them weaken it: `prefer-to-be-truthy` turns `toBe(true)` into `toBeTruthy()`, `prefer-to-be-falsy` turns `toBe(false)` into `toBeFalsy()`, `prefer-strict-equal` turns `toEqual` into `toStrictEqual`, and `prefer-describe-function-title` turns a string title into a bare identifier. A test written to check a value is exactly true then passes for any truthy value. This ran first on every agent edit, then at every commit, and was found in both places on 2026-09-16: colorscope carried 276 weakened assertions and motif 121, one of which broke an env test. Autofix now runs only when a person asks for it, through `lint:fix`. Agent hooks format. Commits format. Lint reports on push and a person decides.
- **Nothing that writes files on `Stop` or `SubagentStop`.** Those fire for every session and subagent in the checkout, so a repo-wide fix or format rewrites files other agents are still editing.
- **No `|| true` or `2>/dev/null` on a formatter.** Four repos ran formatters that did not exist, and nobody saw, because the failure was hidden.
- **Codex:** no project `.codex/hooks.json`. Codex passes `apply_patch` edits as `tool_input.command` with no file path, and most of its writes go through shell commands that tool hooks don't reliably see. `lint-staged` formats Codex's changes at commit.

## Deploying to Vercel

Production deploys are manual. Nothing ships on a push.

- **An arm64 Mac cannot build the artifact.** `vercel build` stamps the architecture of the machine it ran on, and `scripts/check-vercel-prebuilt.mjs` requires x86_64 functions, so a Mac build is rejected before it can be published. `pnpm deploy:prod:linux` clones HEAD into an amd64 OrbStack machine, installs the pinned Node, pnpm and Vercel CLI there, and runs the pull, stamp, build, verify and publish chain. Pass `--no-publish` to build and verify without promoting. It reads `VERCEL_TOKEN_HOWELLS` from the shell (macOS keychain service: vercel-token-howells).
- **Nothing deploys from hosted CI.** Vercel has no OIDC route for CLI deploys, so a hosted deploy would need a long-lived token secret in the repository. The production deploy is `pnpm deploy:prod:linux`, run from the Mac with the team-scoped token in the shell.
- **Verify the deployed SHA, not the deploy's exit code.** `scripts/publish-vercel-prebuilt.mjs` promotes and then confirms the running deployment; the site also answers `/api/internal/version` with the commit it was built from. A green deploy step is not evidence that the SHA you intended is serving.

## UI stack

For new UI repos:

- Next.js App Router
- React
- Tailwind CSS v4
- Base UI primitives (`@base-ui/react`)
- `motion` for animation, imported from `motion/react` in React code
- the Patternmode theme, `@howells/motion` and `@patternmode/*` components as the starting point
- Storybook only for complex shared UI

Use Base UI as the primitive layer for new repos. shadcn now defaults to Base UI, so `npx shadcn init` scaffolds Base UI-backed components. Base UI ships as a single package, `@base-ui/react` — do not split it into per-component packages.

Radix stays a supported deliberate opt-out. Choose it with `npx shadcn init -b radix` when a repo has a concrete reason. On Radix, use the unified `radix-ui` package. Do not install the split per-component Radix packages.

Share structural decisions; keep brand and product expression local.

### Next.js baseline

- Turbopack is the default bundler.
- Adopt Cache Components (`use cache`) as the caching model.
- Use `proxy.ts` for request interception. `middleware.ts` is deprecated. This repo ships a `proxy.ts` example itself — markdown content negotiation on the docs routes.

## Client data fetching

Use `@tanstack/react-query` for all client-side data fetching. No raw `fetch` in components.

Rules:

- Create a `lib/api.ts` with typed hooks (`usePersonas`, `useEvaluation`, etc.) wrapping `useQuery` and `useMutation`
- Create a `lib/query-provider.tsx` client component with `QueryClientProvider`
- Server Components fetch data directly from the database or internal packages — React Query is only for client components
- Mutations should invalidate related query keys on success
- SSE streams and one-shot fire-and-forget fetches are the only exceptions to using React Query

Pattern:

```ts
// lib/api.ts
export function usePersonas() {
  return useQuery({
    queryKey: ["personas"],
    queryFn: () => apiFetch<Persona[]>("/api/personas"),
  });
}

export function useUpdatePersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => apiFetch(`/api/personas/${id}`, { method: "PUT", ... }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["personas"] });
      qc.invalidateQueries({ queryKey: ["personas", id] });
    },
  });
}
```

React Query owns loading, errors, caching, and invalidation. Do not rebuild that state with `useEffect`, `useState`, and `fetch`.

## Dependency standard

Active repos share a dependency baseline as well as configuration.

An August 2026 direct-root scan across the local Git checkouts, deduplicated by repository path, found the strongest signals in `typescript` (54), `@howells/lint` (44), `@howells/typescript-config` (32), `turbo` (31), `lint-staged` (29), `vitest` (25), `tsx` (20), and `zod` (19). This broad inventory includes client repositories and documentation mirrors, so use it to rank recurrence rather than to claim that every checkout independently chose the package.

The packages that recur most often in UI work are:

- `motion`
- `lucide-react`
- `zod`
- `cn`
- `sonner`
- `nuqs`
- `next-themes`
- `date-fns`
- `@tanstack/react-query`
- `usehooks-ts`
- `@base-ui/react`
- `@howells/envy`

Repeated package names across Turborepos define these default boundaries:

- first tier: `db`, `ui`, `env`
- second tier: `tailwind-config`, `utils`, `motion`, `auth`, `mastra`, and `trpc` when a same-workspace API needs it
- optional but frequent: `assets`, `upload`, `storage`, `config`

The detailed policy lives in [Default Dependencies](./default-dependencies.md).

For media-heavy projects, there is also a platform-level default:

- use `@howells/motif-sdk` for product image generation, editing, and fal utility integration
- use `@howells/motif-cli` for scriptable and agent-facing creative automation; prefer its JSON/NDJSON output, semantic exit codes, and live `--describe` schema
- prefer the house media storage platform for image, vector, and general media storage/delivery
- use `files-sdk` behind storage/upload packages when project code needs a portable object/blob API across S3-compatible storage, R2, GCS, Azure Blob, Vercel Blob, Netlify Blobs, MinIO, or similar providers

Full-stack apps also share this architecture:

- server composition for app-internal behavior, `tRPC` for same-workspace typed clients, and OpenAPI/oRPC for separate consumers
- React Query for server state
- Drizzle plus Neon for persistence

The detailed guidance lives in [Architecture Defaults](./architecture-defaults.md).

## AI, agents, and MCP

AI-capable repos use this starting shape.

Default package choices:

- `ai` for the Vercel AI SDK surface
- `@howells/ai` for shared provider defaults and house wrappers
- Motif's SDK or CLI when image generation, image editing, media utilities, or agent-facing automation are part of the product
- `zod` for structured model IO and tool schemas
- `@mastra/core` and `mastra` when the repo needs agent orchestration, memory, observability, or workflow structure
- `@modelcontextprotocol/sdk` when the repo exposes MCP tools, resources, or transports
- provider packages such as `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, and `@openrouter/ai-sdk-provider` only when a direct-provider need justifies them

### Model access

`@howells/ai` owns model choice: sizes (nano to reasoning), catalogues and provider routing. Its default route is OpenRouter, which is what the active repos use; Vercel AI Gateway and direct providers stay available behind the same boundary. Repos ask for a size, never a model string, and pass the result to Mastra. `@howells/mastra` carries no model code of its own.

Per-provider `@ai-sdk/*` packages are the escape hatch for direct-provider needs, and they still sit behind `@howells/ai`.

Default boundaries:

- `packages/mastra` for agents, tools, workflows, storage, memory, observability, scorers and the Mastra MCP server
- `packages/mcp` only for a standalone read-only MCP server without Mastra
- `packages/cli` when operations need a real command line

Do not scatter raw provider clients or model strings through app routes.

Use [Agentic Development](./agentic-development.md) for Mastra, agentsurface.dev, MCP, tool design, workflows, memory, and observability guidance.

## Documentation

If the repo needs a docs site:

- prefer Fumadocs for Next.js-based docs experiences
- otherwise keep docs as plain Markdown until the repo actually needs a full docs UI

Do not install a docs framework out of habit.
