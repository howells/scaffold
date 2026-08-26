# Agent workflow

The model owns the development loop. Repo instructions supply local constraints; installed skills supply specialist methods.

## AGENTS.md

Every repo should have a small `AGENTS.md`.

It should cover:

- communication expectations
- editing constraints
- search preferences
- repo-specific rules that are easy for an agent to violate

Keep it short, direct, and operational.

## General development skills

Let the coding assistant handle investigation, planning, implementation, testing, review, and verification. Do not wrap it in another lifecycle runtime by default.

Use Matt Pocock's globally installed skills for explicit methods such as domain modelling, requirement grilling, architecture improvement, or technical writing. Do not copy their instructions into each repo.

[Development skills](./development-skills.md) maps the installed engineering flow, Howells specialists, stack-specific skills, and explicit opt-ins. Use that page for routing; keep this page focused on repository workflow.

Leave durable evidence when a decision needs it: a focused spec, ADR, test, or review. Do not leave project decisions only in chat history.

## Independent skills

`~/Sites/skills` is the independent skill collection. Treat it as reusable agent tooling, not as a package inside each product repo.

Install or update independent skills through the skill installer, usually globally for the assistant doing the work. Do not vendor the skill sources into product repositories, and do not paste their full instructions into repo-local `AGENTS.md` files.

Common Codex install forms:

```bash
npx skills@latest add howells/skills --list
npx skills@latest add howells/skills --agent codex --global
npx skills@latest add howells/skills --skill '*' --agent codex --global
```

The current Howells specialist routes are maintained in [Development skills](./development-skills.md). That map includes structure, recovery, browser QA, UI direction, code quality, agent surfaces, and plugin packaging without duplicating each skill's procedure here.

Do not copy an independent skill's instructions into every repo. Install or invoke the skill when the task needs it, and keep repo-local `AGENTS.md` focused on the current codebase.

## AI, Mastra, and MCP

For AI-capable repos, keep the agent surface explicit:

- use `@howells/ai` before raw provider SDKs in app code
- use Motif's SDK or agent-readable CLI before raw fal.ai clients for image generation, image editing, media utilities, or creative automation
- use repo-local `packages/ai` for product-specific model and provider composition
- use `packages/agents` when prompts, evaluators, tools, or agent definitions are shared
- use Mastra when the repo needs real agent orchestration, memory, workflow state, or observability
- use `packages/mcp` or `packages/mcp-server` for MCP contracts and transports
- validate model IO and tool schemas with `zod`

Do not hide reusable agent or MCP contracts inside a route handler. That makes them harder to test, harder to expose to coding assistants, and harder to reuse from CLIs.

When implementing Mastra code, verify the current API before writing against it. Prefer installed package docs under `node_modules/@mastra/*/dist/docs` when packages are present, and keep the TypeScript target/module setup on ES2022-compatible settings.

For broader agent-facing software design, use [agentsurface.dev](https://agentsurface.dev) and [Agentic Development](./agentic-development.md). That guidance covers Mastra, but also covers API shape, CLI ergonomics, MCP, discovery, tool design, retrievability, orchestration, testing, evaluation, browser access, and sandboxing.

## Rules and project instructions

Do not install a full rules system into every repo by default.

Use project-local rules or instruction files when:

- the repo has multiple agents touching it frequently
- consistency is degrading
- there are project-specific conventions that should be enforced

Do not add a large project-local rule corpus when the repo is still exploring its basic shape. Prefer a concise `AGENTS.md`, the model's native development loop, and installed skills for specialist depth.

## Root scripts agents should expect

Agents should be able to rely on these commands:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm format`
- `pnpm typecheck`
- `pnpm test`
- `pnpm check`

Record any different command names and why they exist.

## Git hooks

Use hooks to stop obvious breakage, not to turn local commits into CI.

Default:

- `pre-commit`: `lint-staged`, `lint`, `typecheck`

Optional:

- `pre-push`: `lint`, `typecheck`, `test`

Rules:

- never auto-commit from repo automation
- keep hook output readable
- if hooks become slow enough that developers bypass them, the hooks are wrong

## Code review stance

Agent-driven review should prioritize:

- regressions
- behavior changes
- missing validation
- test gaps
- config drift

It should not default to taste-based nitpicks.

## Documentation and progress

For substantial work, keep documentation and progress lightweight but real:

- `AGENTS.md` owns concise operational rules
- `CONTEXT.md` owns durable product language, invariants, and expensive lessons when the project needs it
- ADRs and specs own lasting decisions or contracts
- the issue tracker owns active narrative and handoff state
- scripts and generated artifacts own executable probes and repeatable evidence
- temporary plans and handoffs are deleted or folded into a durable home when the task closes
- docs should describe the current system, not preserve outdated migration stories forever
- prose should use short declarative sentences, direct verbs, and evidence for claims

## Worktrees

When more than one harness or agent is active, follow [Worktree Coordination](./worktree-coordination.md). Keep Codex, Claude, and manual work under the shared umbrella but in separate task directories. Branch, stash, handoff, and cleanup operations stay with the coordinating session.

## Environment discipline

Agents should not read `process.env` ad hoc throughout the codebase.

For repos that need typed env handling:

- use `@howells/envy`
- centralize env access
- separate server-only and client-safe variables
- keep `.env.example` in sync
- check provider env before deployment
- scope Turbo task env lists to the tasks that need them

Agents should prefer `envy check local` and provider checks over hand-written shell pipelines. Secrets should never be pushed with `echo`; use Envy helpers or provider CLIs that preserve exact values.
