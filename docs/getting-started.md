---
title: "Getting started"
description: "Set up a repo, choose its archetype, wire config, enforce boundaries, and record deviations."
---

# Getting started

Use this sequence when creating a new repo.

These defaults are tuned for new TypeScript, UI, data, agent, and package work. Do not let legacy PHP/Craft dependencies influence the default shape of a new repo.

## 1. Choose the repo shape

Default to a `pnpm` monorepo:

```text
apps/
packages/
docs/
```

Add another top-level glob only when it has a clear owner and purpose.

Before creating files, choose the repo archetype from [Repo Archetypes](./reference/repo-archetypes.md). That decision should drive the package graph, deployment target, and dependency baseline.

## 2. Decide whether this is a UI project

If the project ships a UI:

- start from the bundled UI baseline in [UI Projects](./reference/ui-projects.md)
- default to Next.js App Router
- keep shared primitives in a package, not in the app
- include Storybook when the repo exports reusable UI

If the project is not UI-first:

- still use the same `pnpm`, TypeScript, Oxlint/Oxfmt, `@howells/husky`, and Turbo baseline
- prefer thinner workspace structure and fewer packages

If this is a full-stack product app rather than a simple UI shell:

- treat Drizzle and Neon as the default persistence architecture, and React Query as the default when the client owns server-state
- choose the narrowest typed API boundary: server composition for app-internal work, `tRPC` for same-workspace consumers, and a versioned OpenAPI/oRPC contract for separately deployed or non-TypeScript consumers
- split shared infra into packages instead of burying it in one app
- use `@howells/envy` for typed env parsing and deployment env checks when runtime env exists
- default package boundaries to `db`, `ui`, `typescript-config`, `tailwind-config`, `env`, and `motion`; add `trpc`, `auth`, repo-local `ai`, `agents`, `mcp`, `assets`, or `upload` only where the repo actually needs them

If the repo is AI-capable, agent-heavy, or ingestion-heavy:

- use `@howells/ai` as the provider baseline before adding raw provider SDKs
- use `howells/motif` packages for fal.ai image generation, editing, utility media tools, and agent-facing creative automation
- add repo-local `ai`, `mastra`, `agents`, `mcp`, `cli`, `ingestion`, or `enrichment` packages based on real reuse boundaries
- use Mastra when the work is agent orchestration, memory, observability, or MCP-adjacent workflow, not for one-off model calls
- use `zod` for tool, model IO, and transport contracts
- use [Agentic Development](./reference/agentic-development.md) before scaffolding agent-facing surfaces

## 3. Create the baseline files first

Start with these files before writing app code:

- `package.json`
- `.node-version`
- `pnpm-workspace.yaml`
- `turbo.json`
- `oxlint.config.ts`
- `oxfmt.config.ts`
- `tsconfig.json`
- `components.json` for UI repos
- `AGENTS.md`

Use the snippets in [Config Snippets](./reference/config-snippets.md).

Choose the first package boundaries with [Package Boundaries](./reference/package-boundaries.md). Keep shared infrastructure out of app code.

## 4. Install the shared config packages

For the current house baseline:

- `@howells/lint`
- `@howells/typescript-config`
- `turbo`
- `typescript`
- `@howells/husky`
- `lint-staged`
- `tsx`
- `vitest`
- `@howells/envy` when the repo has runtime env

Do not install direct `oxlint` or `oxfmt` dependencies. Use the `@howells/lint` Oxlint/Oxfmt lane.

## 5. Keep the scripts standard

Keep these root script names unless the repo records a reason to differ:

- `dev`
- `dev:all`
- `build`
- `lint`
- `format`
- `typecheck`
- `test`
- `check`
- `check:affected`
- `clean`
- `prepare`

The exact commands can vary by repo, but the script contract should stay stable.

## 6. Add the agent and rules layer deliberately

Every repo should have a concise `AGENTS.md`. Add platform-specific configuration only for tools the repo uses.

- keep `AGENTS.md` short and focused on repo-specific constraints
- add assistant-specific MCP config only when the repo benefits from project-specific servers
- rely on the coding assistant's native capabilities and the [development skill map](./reference/development-skills.md) for explicit planning, implementation, review, testing, and architecture methods
- keep repo-local rules small; use project-specific instructions only when the repo has conventions the model and installed skills cannot infer
- use independent skills from `~/Sites/skills` for specialist work such as UI polish, browser field testing, package extraction, boundary checks, naming, prose cleanup, and plugin packaging

Start with `AGENTS.md`. Add Codex, Claude Code, Cursor, MCP, or workflow support only when used.

## 7. Verify the baseline before feature work

Run these before feature work:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Fix this gate before feature work.

## 8. Record intentional deviations

If you do not use the default stack, write down the reason early:

- why not Next.js for a UI app
- why not Drizzle and Neon for persistence
- why the chosen API boundary fits its consumers and deployment shape
- why not `@howells/ai` for AI provider plumbing
- why not `@howells/envy` for runtime env
- why not the bundled UI baseline for shared UI primitives

Recorded deviations prevent the same decision from being reopened in every repo.

## 9. Pick the deployment shape early

Do not leave hosting and runtime shape implicit.

Use [Deployment Defaults](./reference/deployment-defaults.md) to choose between:

- Vercel for Next.js apps, docs, and Storybook-like web surfaces
- Railway for worker-heavy or service-heavy systems
- the house media storage packages when the project has real media storage and delivery needs
