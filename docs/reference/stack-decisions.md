---
title: "Stack Decisions"
description: "These are the current default decisions for new TypeScript product work and shared config repos."
---

# Stack Decisions

These are the current default decisions for new TypeScript product work and shared config repos.

## Core Tools

The default toolchain for new TypeScript work:

- **Package manager:** `pnpm`
- **Task runner:** Turborepo
- **Language:** TypeScript
- **Lint and format:** `@howells/lint` (Oxlint / Oxfmt)
- **TypeScript config:** `@howells/typescript-config`
- **Env parsing:** `@howells/envy`
- **Git hooks:** `husky` with `lint-staged`
- **Runtime:** Node 24 LTS

The exact versions are pinned by the shared config packages and the root `package.json`. Consume those rather than restating numbers here, which drift the moment a dependency bumps.

## Package Manager

- Use `pnpm`.
- Pin `packageManager` in the root `package.json`.
- Prefer one lockfile at the repo root.
- Use Node 24 LTS for development, CI, apps, and services.
- Default workspace layout is:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

## Node Version Policy

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

The recent pattern across active Turborepos is clear: hidden stale-cache failures cost more than slower local runs.

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
- keep local `paths` and `baseUrl` in the consumer repo only

## Linting and Formatting

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

## Environment Variables

Use `@howells/envy` for repos with runtime configuration.

Default approach:

- put the schema in `packages/env`
- parse explicitly by default
- expose separate server and client env modules
- allow direct `process.env` only inside the env boundary
- run local env checks in `pnpm check`
- run Vercel or Railway env checks before deploy

Do not keep hand-written dotenv loading, ad hoc `process.env` reads, or provider env setup scripts once Envy can own that surface.

## Husky and Git Hooks

Use Husky for lightweight quality gates.

Default approach:

- `prepare`: `husky`
- `pre-commit`: run `lint-staged`, then repo-wide `lint` and `typecheck`
- `pre-push`: only when the repo needs a heavier gate such as `test` or stricter validation

Across recent repos, the stable baseline is small hooks plus standard root scripts.

## UI Stack

For new UI repos:

- Next.js App Router
- React
- Tailwind CSS v4
- Base UI primitives (`@base-ui/react`)
- `motion` for animation, imported from `motion/react` in React code
- Storybook for reusable exported components
- the bundled UI baseline as the starting point for shared UI packages

Use Base UI as the primitive layer for new repos. shadcn now defaults to Base UI, so `npx shadcn init` scaffolds Base UI-backed components. Base UI ships as a single package, `@base-ui/react` — do not split it into per-component packages.

Radix stays a supported deliberate opt-out. Choose it with `npx shadcn init -b radix` when a repo has a concrete reason. On Radix, use the unified `radix-ui` package. Do not install the split per-component Radix packages.

This does not mean every product should look the same. It means structural decisions should be shared while brand and product expression stay local.

### Next.js baseline

- Turbopack is the default bundler.
- Adopt Cache Components (`use cache`) as the caching model.
- Use `proxy.ts` for request interception. `middleware.ts` is deprecated. This repo ships a `proxy.ts` example itself — markdown content negotiation on the docs routes.

## Client Data Fetching

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

This replaces `useEffect` + `useState` + `fetch` patterns. React Query handles loading states, error states, caching, and cache invalidation.

## Dependency Standard

The active repos are not just converging on config. They are also converging on a real dependency baseline.

The strongest direct-dependency signals across a recent inventory of the active repos are:

- `typescript`: 90 projects
- `react`: 80 projects
- `tailwindcss`: 75 projects
- `next`: 72 projects
- `zod`: 54 projects
- `@howells/lint`: 48 projects
- `lucide-react`: 48 projects
- `vitest`: 47 projects
- `turbo`: 45 projects
- `motion`: 44 projects
- `tsx`: 43 projects
- `@howells/typescript-config`: 40 projects
- `drizzle-orm`: 33 projects
- `@neondatabase/serverless`: 31 projects
- `ai`: 22 projects
- `@mastra/core`: 18 projects
- `@modelcontextprotocol/sdk`: 18 projects

The packages that recur most often in UI work are:

- `motion`
- `lucide-react`
- `zod`
- `clsx`
- `tailwind-merge`
- `sonner`
- `nuqs`
- `next-themes`
- `date-fns`
- `@tanstack/react-query`
- `usehooks-ts`
- `@base-ui/react`
- `@howells/envy`

The repeated package names across your Turborepos are also clear enough to treat as default boundaries, not accidental patterns:

- first tier: `db`, `ui`, `typescript-config`, `tailwind-config`
- second tier: `utils`, `trpc`, `motion`, `auth`, `mastra`, `agents`, `mcp`, repo-local `ai` packages above `@howells/ai`
- optional but frequent: `assets`, `upload`, `storage`, `env`, `config`

The detailed policy lives in [Default Dependencies](./default-dependencies.md).

For media-heavy projects, there is also a platform-level default:

- use `howells/motif` for image generation, editing, utility media tools, and agent-facing creative automation
- prefer the house media storage platform for image, vector, and general media storage/delivery
- use `files-sdk` behind storage/upload packages when project code needs a portable object/blob API across S3-compatible storage, R2, GCS, Azure Blob, Vercel Blob, Netlify Blobs, MinIO, or similar providers

There is also a recurring architecture baseline for full-stack apps:

- `tRPC` for typed API boundaries
- React Query for server state
- Drizzle plus Neon for persistence

The detailed guidance lives in [Architecture Defaults](./architecture-defaults.md).

## AI, Agents, and MCP

AI-capable repos are now common enough that they should have a standard starting shape.

Default package choices:

- `ai` for the Vercel AI SDK surface
- `@howells/ai` for shared provider defaults and house wrappers
- `howells/motif` packages when image generation, image editing, media utilities, CLI automation, or MCP image tools are part of the product
- `zod` for structured model IO and tool schemas
- `@mastra/core` and `mastra` when the repo needs agent orchestration, memory, observability, or workflow structure
- `@modelcontextprotocol/sdk` when the repo exposes MCP tools, resources, or transports
- provider packages such as `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, and `@openrouter/ai-sdk-provider` only when a direct-provider need justifies them

### Model access

Default model access is OpenRouter as the gateway, wrapped by the Vercel AI SDK. Pass a `"provider/model"` string through the AI SDK and requests route through OpenRouter — one credential, provider switching without new SDK wiring, and no per-provider client in app code. The Vercel AI Gateway is not the default here.

Per-provider `@ai-sdk/*` packages are the escape hatch for direct-provider needs, and they still sit behind `@howells/ai`. Keep model-string selection behind that boundary rather than hardcoding provider strings across app routes.

Default boundaries:

- `packages/ai` for repo-specific model/provider composition above `@howells/ai`
- `packages/mastra` for Mastra runtime code, agents, tools, workflows, storage, memory, observability, scorers, and runtime routes
- `packages/agents` for reusable non-Mastra product agents, evaluators, prompts, and tool wiring
- `packages/mcp` or `packages/mcp-server` for MCP contracts and server code
- `packages/cli` when ingestion or model workflows need a real command line

Do not scatter raw provider clients through app routes. Keep provider plumbing behind `@howells/ai` or a repo-local `packages/ai` boundary.

Use [Agentic Development](./agentic-development.md) for Mastra, agentsurface.dev, MCP, tool design, workflows, memory, and observability guidance.

## Documentation

If the repo needs a docs site:

- prefer Fumadocs for Next.js-based docs experiences
- otherwise keep docs as plain Markdown until the repo actually needs a full docs UI

Do not install a docs framework out of habit.
