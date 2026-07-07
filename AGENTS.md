# Scaffold - Agent Instructions

## Communication Expectations

- Treat this repo as the source of the Scaffold Baseline, not as a one-off template.
- State which reference doc or skill packaging surface you are changing.
- Keep explanations short and operational; this repo exists to reduce ambiguity in other repos.

## How To Work In This Codebase

- Start with `CONTEXT.md` for project language and `docs/README.md` for documentation structure.
- The canonical baseline lives in `docs/reference/`; skill packaging should reflect those docs rather than fork them.
- `docs/reference/agent-workflow.md` defines what root `AGENTS.md` files should cover.
- Keep generated or packaged agent-skill material aligned with Project Docs.

## Editing Constraints

- Do not turn scaffold docs into project-specific guidance for one repo.
- Do not vendor independent skills into product repos; link or install them when needed.
- Keep `AGENTS.md` guidance short: communication expectations, editing constraints, search preferences, and repo-specific rules.
- Avoid adding runtime dependencies unless the docs/skill distribution actually needs them.

## Search Preferences

- Search `docs/reference/` before adding new baseline policy.
- Search `CONTEXT.md` before changing terms like Scaffold Baseline, Project Docs, Agent Skill, or Skill Wrapper.
- Search existing reference docs before creating a new one.

## Commands

- `pnpm dev` - run the Next.js docs surface.
- `pnpm lint` - run Oxlint through the Scaffold baseline.
- `pnpm format` - format tracked files with oxfmt through the Scaffold baseline.
- `pnpm typecheck` - run TypeScript checks.
- `pnpm build` - build the Next.js docs surface.
- `pnpm check` - lint, typecheck, and build.
- For docs-only edits, still verify with Markdown review and targeted searches when a full build is unnecessary.

## Repo-Specific Rules

- Arc is recommended for structured delivery workflows in consuming repos, but Scaffold should document when to use it rather than embed Arc internals.
- Mastra guidance belongs in agentic development docs and only applies to repos that need real orchestration.
- `@howells/lint`, `@howells/envy`, and package-boundary guidance should reflect current shared package standards.
