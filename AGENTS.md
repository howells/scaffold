# Scaffold

The house baseline for starting or standardising a Howells project. It defines repo shape, stack, package boundaries, agent workflow, deployment, and launch checks. It is a standard, not a template.

`docs/` is the source of truth. `skills/scaffold` is a distribution surface, generated from it.

## What a new project takes from here

Read `docs/README.md` first, then open only the reference page needed for the task.

Defaults a new repo inherits:

- pnpm monorepo, usually `apps/*` and `packages/*`, with Turborepo and cache disabled until the repo proves it's deterministic.
- Next.js App Router, React, Tailwind v4, Base UI, and Storybook when the repo exports reusable UI; unified Radix is the deliberate opt-out.
- `@howells/lint` on the Oxlint/Oxfmt lane, `@howells/typescript-config` for tsconfig presets, `@howells/envy` for typed env parsing and deploy-time env checks.
- Drizzle and Neon for product data, the narrowest typed API boundary that fits, and React Query when the client owns server-state.
- `@howells/ai` as the provider baseline, Motif's SDK or agent-readable CLI for image work, product orchestration in a repo-local `ai` or `agents` package, and MCP in its own package only when the product genuinely exposes it.

`docs/reference/agent-workflow.md` defines what a root `AGENTS.md` should cover. Other decisions live in `docs/reference/`; deviations live in `docs/adr/`.

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
- Write short, declarative prose. Cut scene-setting, recaps, fake contrasts, vague praise, and claims without evidence.
- Prefer a paragraph or short list to a table unless exact comparison is the point.

## Commands

- `pnpm dev` - Next.js docs site.
- `pnpm typecheck` - regenerates the Fumadocs source, then `tsc --noEmit`.
- `pnpm lint` / `pnpm lint:fix` / `pnpm format` - the shared `@howells/lint` lane.
- `pnpm build` - production build.
- `pnpm check` - lint, typecheck, build, plus the two generated-surface drift checks.
