# Scaffold

The house baseline for starting or standardising a project: repo shape, stack, package boundaries, agent workflow, deployment and launch checks. It is a standard, not a template.

`docs/` is the source of truth. `skills/scaffold` is a distribution surface generated from it.

Read `docs/README.md` first, then open only the reference page the task needs. `docs/reference/agent-workflow.md` defines what a root `AGENTS.md` covers. Deviations live in `docs/adr/`.

## Generated surfaces, never hand-edited

- `docs/principles.md` comes from `src/content/principles.ts` via `pnpm generate:principles`. The homepage renders the same module, so they can't drift.
- `skills/scaffold/references/` comes from `docs/` via `pnpm sync:skill`. Edit the docs once, then sync.
- `pnpm test` runs both with `--check`, so a docs edit without a regenerate breaks the gate.

## Editing this repo

- Don't turn scaffold docs into guidance for one repo. If it only applies to one project, it belongs in that project's `AGENTS.md`.
- Search `docs/reference/` before adding baseline policy, and search the existing pages before creating a new one.
- Search `CONTEXT.md` before changing the terms Scaffold Baseline, Project Docs, Agent Skill, Agent Skill Distribution or Skill Wrapper.
- Don't add runtime dependencies unless the docs site or the skill distribution genuinely needs them.
- The Oxlint config-spelling trap and the no-disposals rule live in `docs/reference/config-snippets.md`. Read it before wiring lint anywhere.
- Write short declarative prose. Cut scene-setting, recaps, fake contrasts, vague praise and unevidenced claims. Prefer a paragraph or short list to a table unless exact comparison is the point.

## Commands

- `pnpm dev` - the Next.js docs site.
- `pnpm typecheck` regenerates the Fumadocs source, then runs `tsc --noEmit`.
- `pnpm lint`, `pnpm lint:fix`, `pnpm build`.
- `pnpm lint:ratchet` is the lint gate: it fails only when a rule rises above `scripts/lint-baseline.json`.
- `pnpm test` - the documentation-integrity script plus the two drift checks.
- `pnpm prepush` - typecheck, the lint ratchet and test. The pre-push hook runs it.
