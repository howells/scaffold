# Scaffold

The house baseline for starting or standardising a project: repo shape, stack, package boundaries, deployment and launch checks. It is a standard, not a template.

`docs/` is the source of truth. `skills/scaffold` is a distribution surface generated from it. Start at `docs/README.md` and open only the page the task needs. Deviations live in `docs/adr/`.

## Generated, never hand-edited

- `docs/principles.md` comes from `src/content/principles.ts` via `pnpm generate:principles`.
- `skills/scaffold/references/` comes from `docs/` via `pnpm sync:skill`. Edit the docs, then sync.
- `pnpm test` runs both with `--check`, so a docs edit without a regenerate fails.

## Editing

- Baseline policy goes in `docs/reference/`; project-specific guidance belongs in that project's `AGENTS.md`. Search before adding a page.
- Terms in `GLOSSARY.md` (Scaffold Baseline, Project Docs, Agent Skill, Agent Skill Distribution, Skill Wrapper) are fixed.
- Lint config trap: see `docs/reference/config-snippets.md` before wiring lint anywhere.
- Production deploys are local (`pnpm deploy:prod`: vercel pull, build and deploy --prebuilt); nothing ships from hosted CI.
- Don't overwrite others' uncommitted work.

## Commands

`pnpm dev` (docs site), `pnpm typecheck`, `pnpm lint`, `pnpm lint:fix`, `pnpm build`, `pnpm test`.

## Agent skills

### Issue tracker

Linear, workspace `howells`, team `HOW`. See `~/Sites/home/docs/agents/issue-tracker.md`.

### Triage labels

Default triage labels. See `~/Sites/home/docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `~/Sites/home/docs/agents/domain.md`.
