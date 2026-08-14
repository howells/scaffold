# Agent Workflow

This is the baseline for repos worked on with coding assistants and reusable skills. The model owns the general development loop; repo-local instructions supply only the context it cannot infer, and installed skills add specialist methods when a task benefits from them.

## AGENTS.md

Every repo should have a small `AGENTS.md`.

It should cover:

- communication expectations
- editing constraints
- search preferences
- repo-specific rules that are easy for an agent to violate

Keep it short and direct. The best `AGENTS.md` files change behavior without becoming documentation sludge.

## General Development Skills

Let Claude Code, Codex, or the current coding assistant handle ordinary investigation, planning, implementation, testing, review, and verification directly. Do not install a second lifecycle runtime around a capable model by default.

Use Matt Pocock's skills as the canonical reusable methods for general software-development work when a task needs a more explicit technique, such as domain modelling, grilling a requirement, architecture improvement, or structured technical writing. Install those skills globally rather than copying their instructions into each repo.

The model and its skills should still leave durable evidence where the work benefits from it: a focused spec, decision record, test, or review document. The absence of a workflow framework is not permission to hide decisions in chat history.

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

Do not hide reusable agent or MCP contracts inside a route handler. That makes them harder to test, harder to expose to coding assistants, and harder to reuse from CLIs.

When implementing Mastra code, verify the current API before writing against it. Prefer installed package docs under `node_modules/@mastra/*/dist/docs` when packages are present, and keep the TypeScript target/module setup on ES2022-compatible settings.

For broader agent-facing software design, use [agentsurface.dev](https://agentsurface.dev) and [Agentic Development](./agentic-development.md). That guidance covers Mastra, but also covers API shape, CLI ergonomics, MCP, discovery, tool design, retrievability, orchestration, testing, evaluation, browser access, and sandboxing.

## Rules and Project Instructions

Do not install a full rules system into every repo by default.

Use project-local rules or instruction files when:

- the repo has multiple agents touching it frequently
- consistency is degrading
- there are project-specific conventions that should be enforced

Do not add a large project-local rule corpus when the repo is still exploring its basic shape. Prefer a concise `AGENTS.md`, the model's native development loop, and installed skills for specialist depth.

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

For substantial work, keep documentation and progress lightweight but real:

- `AGENTS.md` owns concise operational rules
- `CONTEXT.md` owns durable product language, invariants, and expensive lessons when the project needs it
- ADRs and specs own lasting decisions or contracts
- the issue tracker owns active narrative and handoff state
- scripts and generated artifacts own executable probes and repeatable evidence
- temporary plans and handoffs are deleted or folded into a durable home when the task closes
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
