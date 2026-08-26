---
name: scaffold
description: Create, standardize, or audit a Howells project. Covers repo shape, tooling, package boundaries, UI, data, AI, agent workflow, deployment, and launch checks.
---

# Scaffold

Use the house defaults unless the project records a deliberate exception.

## References

Load only the references needed for the current task:

- `references/principles.md` for the philosophy behind the baseline; load when explaining or challenging a default.
- `references/getting-started.md` for the default setup sequence.
- `references/repo-archetypes.md` when choosing repo shape.
- `references/stack-decisions.md` for pinned baseline tools and versions.
- `references/stack-in-practice.md` for the services, packages, and skills actually used across active repos.
- `references/architecture-defaults.md` for app/data/AI architecture defaults.
- `references/package-boundaries.md` for workspace package layout.
- `references/default-dependencies.md` for package selection.
- `references/config-snippets.md` when generating baseline files.
- `references/ui-projects.md` for UI baseline decisions.
- `references/agent-workflow.md` for AGENTS.md, coding-assistant, and reusable-skill setup.
- `references/development-skills.md` for routing work through installed engineering, specialist, and stack-specific skills.
- `references/worktree-coordination.md` for shared Codex, Claude, account-profile, branch, stash, and cleanup policy.
- `references/agentic-development.md` for agentsurface.dev, Mastra, MCP, tools, workflows, memory, observability, and agent-facing software.
- `references/deployment-defaults.md` for hosting/runtime decisions.
- `references/shared-package-candidates.md` when deciding what should become shared.
- `references/launch-checklist.md` for final audit or standardization passes.

If working inside the scaffold repository itself, the source docs in `docs/` are canonical. If installed as a skill, use the bundled `references/` files.

## Start

When invoked:

1. State that you are using the `scaffold` skill.
2. Determine the mode:
   - create a new repo baseline
   - standardize an existing repo
   - choose an archetype or package boundary
   - generate config snippets
   - audit against the launch checklist
3. Read the relevant project files before proposing changes:
   - `package.json`
   - workspace config
   - `turbo.json`
   - `oxlint.config.ts`
   - `oxfmt.config.ts`
   - `tsconfig.json`
   - app/package folders
   - `AGENTS.md`
   - deployment config
4. Ask one concise question only when the project type, target repo, or intended deviation is unclear.

## Create Mode

For a new project:

1. Choose the repo archetype first.
2. Define the minimal workspace package graph.
3. Select default dependencies for the archetype.
4. Generate baseline files from the config snippets.
5. Add agent workflow files only when the repo will be worked on with agents.
6. Run or propose the initial verification commands.

Do not cargo-cult the largest product-app shape into a small package, CLI, or docs repo.

## Standardize Mode

For an existing repo:

1. Detect the current stack and deliberate deviations.
2. Compare only applicable areas against the scaffold baseline.
3. Separate required fixes from optional alignment.
4. Preserve working conventions that are intentional and coherent.
5. Make scoped changes when the user asks for implementation.

Do not overwrite project-specific architecture just to match the scaffold. The scaffold provides defaults, not universal law.

## Output

For planning, provide:

- detected archetype
- proposed package graph
- stack decisions
- files to create or change
- dependency changes
- verification commands
- intentional deviations

For implementation, finish with:

- files changed
- baseline decisions applied
- deviations preserved
- validation results
- remaining setup steps

## Guardrails

- Do not add every possible package boundary up front.
- Do not add UI, database, AI, MCP, or deployment machinery unless the archetype needs it.
- Do not read or include large package inventory JSON/CSV files unless the user asks for evidence analysis.
- Do not mutate an existing repo without reading its current scripts and workspace shape.
- Do not replace a project's deliberate choices without naming the tradeoff.
- Keep prose short and direct. Remove scene-setting, recaps, fake contrasts, and unsupported claims.

## Completion Check

Before finishing, verify that:

- the chosen archetype is explicit
- package boundaries match the archetype
- scripts follow the standard contract or deviations are explained
- verification commands are named
- launch checklist gaps are surfaced when doing an audit
