# Scaffold

The house baseline for starting or standardising a Howells project: repo shape, default stack, package boundaries, agent workflow, deployment and launch readiness. It's a docs-first standard with a Fumadocs site over it, not a template you clone.

`docs/` is the source of truth. `skills/scaffold` is a distribution surface, generated from it.

## What a new project takes from here

Read `docs/README.md` first: it carries the defaults in one page. Then the reference page for the decision in front of you.

Defaults a new repo inherits:

- pnpm monorepo, usually `apps/*` and `packages/*`, with Turborepo and cache disabled until the repo proves it's deterministic.
- Next.js App Router, React, Tailwind v4, Radix, and Storybook when the repo exports reusable UI.
- `@howells/lint` on the Oxlint/Oxfmt lane, `@howells/typescript-config` for tsconfig presets, `@howells/envy` for typed env parsing and deploy-time env checks.
- Drizzle, Neon, tRPC and React Query for product data.
- `@howells/ai` as the provider baseline, `howells/motif` for image work, product orchestration in a repo-local `ai` or `agents` package, MCP in its own package when exposed.

Reference pages: `stack-decisions`, `architecture-defaults`, `repo-archetypes`, `package-boundaries`, `deployment-defaults`, `default-dependencies`, `config-snippets`, `ui-projects`, `shared-package-candidates`, `agent-workflow`, `agentic-development`, `stack-in-practice`, `neon`, `launch-checklist`. `docs/reference/agent-workflow.md` defines what a root `AGENTS.md` should cover. `docs/adr/` records deviations, including this repo's own.

## Generated surfaces - never hand-edit

- `docs/principles.md` is generated from `src/content/principles.ts` by `pnpm generate:principles`. The homepage renders the same module, so they can't drift.
- `skills/scaffold/references/` is generated from `docs/` by `pnpm sync:skill`. Edit docs once, then run the sync.
- `pnpm check` runs both with `--check` and fails on drift, so a docs edit without a regenerate breaks the gate.

## Editing this repo

- Don't turn scaffold docs into guidance for one repo. If it only applies to one project, it belongs in that project's `AGENTS.md`.
- Don't vendor independent skills into product repos; link or install them.
- Search `docs/reference/` before adding new baseline policy, and search existing pages before creating a new one.
- Search `CONTEXT.md` before changing the terms Scaffold Baseline, Project Docs, Agent Skill, Agent Skill Distribution or Skill Wrapper.
- Don't add runtime dependencies unless the docs or skill distribution genuinely needs them.

## Commands

- `pnpm dev` - Next.js docs site.
- `pnpm typecheck` - regenerates the Fumadocs source, then `tsc --noEmit`.
- `pnpm lint` / `pnpm lint:fix` / `pnpm format` - the shared `@howells/lint` lane.
- `pnpm build` - production build.
- `pnpm check` - lint, typecheck, build, plus the two generated-surface drift checks.
