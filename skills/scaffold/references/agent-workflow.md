# Agent Workflow

This is the baseline for repos that will be worked on with coding assistants, Arc, and reusable specialist skills. Claude Code is served natively by the skill directory itself, Codex through a platform wrapper (`agents/openai.yaml`), and a Cursor surface is deferred future work rather than something that ships today.

## AGENTS.md

Every repo should have a small `AGENTS.md`.

It should cover:

- communication expectations
- editing constraints
- search preferences
- repo-specific rules that are easy for an agent to violate

Keep it short and direct. The best `AGENTS.md` files change behavior without becoming documentation sludge.

## Arc

Use Arc as the higher-level software delivery lifecycle when a task needs structure rather than raw code generation.

Current Arc entry points:

- `/arc:vision` for a concise project north star in `docs/vision.md`
- `/arc:ideate` for turning ideas into concrete feature specs
- `/arc:implement` for scope-aware implementation with TDD and verification
- `/arc:testing` for characterization tests around existing code before risky change
- `/arc:review` for expert review of plans, specs, or implementation approaches
- `/arc:audit` for verified codebase health reports
- `/arc:refactor` for structural refactor discovery and RFC-style plans
- `/arc:launch` for go-live and shareability readiness
- `/arc:commit` for clean atomic commits, with push or publish only when requested

In some assistants, the same workflows may be available as skills or commands such as `$ideate`, `$implement`, `$review`, `$audit`, `$refactor`, `$testing`, `$launch`, and `$commit`.

Arc's current full runtime is more than prompt text. It includes:

- `skills/` for the lifecycle workflows
- `commands/` for Claude slash-command stubs
- `agents/` for specialist research, review, build, and workflow support
- `disciplines/` for TDD, debugging, verification, branch finishing, and subagent coordination
- `references/` for Arc-owned architecture, testing, review, platform, and delivery guidance
- `rules/`, `templates/`, `scripts/`, and tests for workflow support

Prefer the full Arc install for repos where agent workflows are central. Arc should expose the same lifecycle guidance through each supported assistant rather than maintaining separate hand-written workflow forks. Prompt-only installs are acceptable for lightweight routing, but they do not include Arc's bundled agents, references, disciplines, templates, scripts, or rules.

Arc's specialist agents are support machinery. Users should normally start with a lifecycle workflow, not a specialist agent. Completed workflow activity may be logged to `.arc/log.md`; keep that as local operational history rather than product documentation.

Do not route specialist work through Arc just because Arc exists. Arc owns the delivery lifecycle. Brand systems, UI direction, browser QA, package extraction, prose cleanup, boundary enforcement, plugin packaging, and naming should use the independent skills collection when that gives a sharper tool.

## Independent Skills

`~/Sites/skills` is the independent skill collection. Treat it as reusable agent tooling, not as a package inside each product repo.

Install or update independent skills through the skill installer, usually globally for the assistant doing the work. Do not vendor the skill sources into product repositories, and do not paste their full instructions into repo-local `AGENTS.md` files.

Common Codex install forms:

```bash
npx skills@latest add howells/skills --list
npx skills@latest add howells/skills --agent codex --global
npx skills@latest add howells/skills --skill '*' --agent codex --global
```

Use independent skills when a task is cross-repo and specialist:

- `aperture` for extracting reusable packages, features, components, hooks, or utilities
- `chiaroscuro`, `brand`, and `foundry` for visual direction, brand systems, and Tailwind v4 identity work
- `fieldtest` for rendered browser QA with evidence-backed findings
- `componentize` for UI reuse audits and scoped shared-component promotion
- `fenceline` for JavaScript and TypeScript boundary enforcement with `@howells/boundaries`
- `fail-fast` for removing hidden fallbacks and permissive compatibility paths
- `heathen` for oversized files, god components, and safe decomposition plans
- `marginalia` for concise JSDoc on public APIs and complex exports
- `mastraudit` for Mastra implementation and package-boundary audits
- `nomen` for naming and availability checks
- `deslop` for cleaning AI-sounding prose
- `polyplugin` for dual Claude Code and Codex plugin packaging

Do not copy an independent skill's instructions into every repo. Install or invoke the skill when the task needs it, and keep repo-local `AGENTS.md` focused on the current codebase.

## AI, Mastra, and MCP

For AI-capable repos, keep the agent surface explicit:

- use `@howells/ai` before raw provider SDKs in app code
- use `howells/motif` before raw fal.ai clients for image generation, image editing, media utilities, CLI automation, or MCP image tools
- use repo-local `packages/ai` for product-specific model and provider composition
- use `packages/agents` when prompts, evaluators, tools, or agent definitions are shared
- use Mastra when the repo needs real agent orchestration, memory, workflow state, or observability
- use `packages/mcp` or `packages/mcp-server` for MCP contracts and transports
- validate model IO and tool schemas with `zod`

Do not hide reusable agent or MCP contracts inside a route handler. That makes them harder to test, harder to expose to Codex or Arc, and harder to reuse from CLIs.

When implementing Mastra code, verify the current API before writing against it. Prefer installed package docs under `node_modules/@mastra/*/dist/docs` when packages are present, and keep the TypeScript target/module setup on ES2022-compatible settings.

For broader agent-facing software design, use [agentsurface.dev](https://agentsurface.dev) and [Agentic Development](./agentic-development.md). That guidance covers Mastra, but also covers API shape, CLI ergonomics, MCP, discovery, tool design, retrievability, orchestration, testing, evaluation, browser access, and sandboxing.

## Rules and Project Instructions

Do not install a full rules system into every repo by default.

Use project-local rules or instruction files when:

- the repo has multiple agents touching it frequently
- consistency is degrading
- there are project-specific conventions that should be enforced

Do not add a large project-local rule corpus when the repo is still exploring its basic shape. Prefer a concise `AGENTS.md`, Arc for delivery workflow, and independent skills for specialist depth.

## Root Scripts That Agents Should Expect

Agents should be able to rely on these commands:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm format`
- `pnpm typecheck`
- `pnpm test`
- `pnpm check`

If a repo chooses different names, it is increasing friction for no real gain.

## Git Hooks

Use hooks to stop obvious breakage, not to turn local commits into CI.

Default:

- `pre-commit`: `lint-staged`, `lint`, `typecheck`

Optional:

- `pre-push`: `lint`, `typecheck`, `test`

Rules:

- never auto-commit from repo automation
- keep hook output readable
- if hooks become slow enough that developers bypass them, the hooks are wrong

## Code Review Stance

Agent-driven review should prioritize:

- regressions
- behavior changes
- missing validation
- test gaps
- config drift

It should not default to taste-based nitpicks.

## Documentation and Progress

When using Arc-style workflows, keep documentation and progress lightweight but real:

- plans go in `docs/` when the repo benefits from them
- progress logs should capture decisions, not every keystroke
- docs should describe the current system, not preserve outdated migration stories forever

## Environment Discipline

Agents should not read `process.env` ad hoc throughout the codebase.

For repos that need typed env handling:

- use `@howells/envy`
- centralize env access
- separate server-only and client-safe variables
- keep `.env.example` in sync
- check provider env before deployment
- scope Turbo task env lists to the tasks that need them

Agents should prefer `envy check local` and provider checks over hand-written shell pipelines. Secrets should never be pushed with `echo`; use Envy helpers or provider CLIs that preserve exact values.
