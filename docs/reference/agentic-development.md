---
title: "Agentic development"
description: "The reference for repos that expose agent-facing behavior: agent-owned tools, workflows, memory, traces, MCP, and long-running AI jobs."
---

# Agentic development

Use this reference for agent-facing behaviour, tools, workflows, memory, traces, MCP, or long-running AI jobs.

## Source of truth

[agentsurface.dev](https://agentsurface.dev) is the broader reference for agentic development. Use it for API surface, CLI design, MCP servers, discovery, authentication, errors, testing, multi-agent patterns, scoring, tool design, retrievability, and orchestration.

The local `surface` skill from the Agent Surface repo is the right specialist tool when a repo needs to become more legible, callable, or useful to agents. Use it for:

- auditing agent readiness
- improving API, CLI, MCP, discovery, auth, testing, errors, tool design, or retrievability
- producing transformation plans for agent-facing surfaces
- scaffolding agents, tools, workflows, memory, model routing, browser access, or sandboxing

Do not make every product repo carry a copy of that guidance. Link to agentsurface.dev and invoke the `surface` skill when the work is specifically about making software agent-ready.

## When agent infrastructure is warranted

Do not add agent infrastructure for a single prompt, one route handler, or a simple model completion. Use ordinary app/service code with `@howells/ai`, `ai`, and `zod` until the behavior needs agent structure.

Add agentic infrastructure when at least one of these is true:

- the system needs tool-using agents that choose between multiple actions
- a user-visible task runs through several stateful AI steps
- the work needs durable workflow state, retries, or resumability
- the repo needs memory, thread history, or semantic recall
- multiple agents or specialists must coordinate
- the app needs Studio-like inspection for agents, tools, workflows, traces, or scores
- the repo exposes MCP tools, resources, or transports
- the AI surface needs first-class tests, traces, quality scoring, or operational controls

Start with one agent and focused tools. Add workflows after the process is defined. Add agents only when responsibility splits by domain.

## Framework selection

Keep an existing deliberate agent framework unless its constraints no longer fit.

Default choices:

- simple model calls: `ai` plus `@howells/ai`
- image generation, image editing, and media utilities: `howells/motif`
- structured model IO or CLI-model calls: consider `@howells/envelope`
- app-owned tool-using agents and workflows: Mastra
- external agent interoperability: MCP package or server boundary
- browser or sandbox capabilities: use Agent Surface guidance before inventing wrappers

Mastra is the default serious agent/workflow framework when the repo needs agents, workflows, tools, memory, storage, observability, or Studio inspection. It is not the default for one-off completions.

## Mastra rules

Use `$mastra` before writing or reviewing Mastra code. Mastra changes quickly, so do not trust memory for constructor signatures, imports, model strings, storage, memory, workflows, tools, or CLI behavior.

Lookup order:

1. If Mastra packages are installed, read embedded docs under `node_modules/@mastra/*/dist/docs/`.
2. If embedded docs do not answer the question, inspect installed type definitions and source.
3. If packages are not installed, use current remote docs from the Mastra skill.
4. For model names, run the provider registry from the Mastra skill before choosing or validating model strings.

Mastra model strings should use the `"provider/model-name"` format. Do not guess current model names.

Mastra code should be ESM-friendly:

- package `type` should be `"module"` when the package owns Mastra runtime code
- TypeScript should target ES2022-compatible modules
- `moduleResolution` should be compatible with the installed Mastra guidance
- local package presets from `@howells/typescript-config` are fine when they produce the right ESM shape

## Preferred package boundary

When Mastra becomes part of a product, give it a dedicated workspace package:

```text
packages/
  ai/          # provider/model composition above @howells/ai
  mastra/      # Mastra runtime, agents, tools, workflows, memory, storage, observability
  mcp/         # MCP contracts and transports when exposed externally
  sessions/    # app-facing job/session orchestration when needed
```

Put Mastra in `packages/mastra`. App code should call product services or a small dispatch surface.

Use `packages/agents` only when the repo has reusable non-Mastra agent definitions, prompts, evaluators, or tool wiring that should not live in the Mastra runtime package. If Mastra owns the runtime, `packages/mastra` should be the main agent/workflow boundary.

## Mastra package shape

A substantial Mastra package should be organized by runtime concern:

```text
packages/mastra/
  src/
    index.ts
    agents/
    tools/
    workflows/
    schemas/
    prompts/
    runtime/
    observability/
    scorers/
    processors/
```

Keep the root `index.ts` as the Mastra runtime registration point. It should assemble:

- agents
- tools
- workflows
- storage
- memory
- observability
- scorers
- API routes
- background task configuration

Use explicit package exports for runtime surfaces that other packages need. Avoid importing deep internal files from app code.

## Agent design

Use agents for open-ended reasoning with tools. Use workflows for defined multi-step processes.

Good agents have:

- stable ids in a simple machine format, such as `source_analyst`
- human-readable names
- one responsibility
- clear instructions loaded from prompt blocks or templates
- explicit tool registration
- memory only when conversation or working context matters
- conservative `maxSteps`
- `prepareStep` or equivalent controls when a turn must call a tool
- background-task configuration only when long tool calls are expected

Prefer a small set of domain agents over many tiny task agents. A supervisor agent is appropriate when it delegates to specialists and owns the overall goal, but avoid agent meshes where every agent can call every other agent.

## Tool design

Mastra tools should be intent-shaped, not generic transport wrappers.

Use:

- `createTool` from current Mastra docs
- verb_noun ids such as `analyze_source`, `compile_prompt`, or `crop_region`
- purpose-led descriptions
- Zod input and output schemas
- deterministic error behavior
- background execution config for slow tools
- small outputs that are usable by downstream tools

Do not expose `httpRequest`, `runSql`, or other broad tools unless the product explicitly requires that level of power and the safety model is clear.

Tool schemas should live in `schemas/` or in domain packages and be re-exported through the Mastra package when app code needs the contract. Keep tool descriptions precise enough that a model can choose correctly without reading implementation code.

For image-generation tools, prefer Motif before creating a fresh provider integration. Use `@howells/motif-sdk` inside product or package code and `@howells/motif-cli` for scriptable local and agent workflows. The CLI's JSON/NDJSON output, semantic exit codes, and live `--describe` schema are the maintained agent surface; Motif's former MCP package is retired.

Keep generated media storage separate from generation. Motif should create or transform media; the product storage layer should persist and deliver final assets.

## Workflows

Use Mastra workflows for defined processes with ordered, parallel, or repeated steps.

Good workflows have:

- explicit ids in a stable kebab-case format
- input and output schemas
- atomic steps with domain names
- `.commit()` after composing the workflow
- state and event tracing for user-visible progress
- limited concurrency when external calls, generated assets, or storage writes need ordering
- wrapper functions that parse inputs and outputs before crossing package boundaries

Use `.parallel()` when independent steps can run safely. Use `.foreach()` with explicit concurrency when repeated work can be bounded.

Do not use a workflow as a dumping ground for arbitrary app code. If a step is deterministic domain logic, keep that logic in a domain package and call it from the workflow step.

## Runtime and app integration

Keep the user-facing app decoupled from the Mastra runtime.

Preferred integration patterns:

- local mode: app service enqueues a job and drains an in-process queue that calls the Mastra workflow runner
- remote mode: app service dispatches to a Mastra server API route with a signed or bearer-authenticated request
- durable adapter: use a durable execution integration when a run must outlive the request or process; keep product-owned state and idempotency, typed suspend/resume contracts, bounded retries, cancellation, and visible progress
- persisted jobs: database owns job status, input, output, errors, and trace events
- UI status: app reads persisted job state and workflow events, not private Mastra internals

Mastra server routes should:

- validate authorization
- parse request bodies with Zod
- return `202 accepted` for async dispatch
- record failures into the product job store
- avoid blocking the request on long-running workflow completion

The app should not build raw Mastra calls in React components or route handlers. Put dispatch and polling behavior behind a product service package.

## Storage, memory, and observability

Use memory only where the agent benefits from thread history or working context. Do not add memory just because the package supports it.

Use durable storage when:

- workflow runs must survive process restarts
- memory should persist across turns
- traces, scores, or observations matter operationally
- Studio inspection should reflect production-like state

Common shape:

- Postgres for default Mastra storage
- in-memory storage for tests or explicit fake drivers
- separate observability storage when trace volume or query patterns justify it
- environment-controlled drivers for local, fake, and remote modes

Observability should be product-useful:

- emit workflow started, step complete, workflow failed, and workflow complete events
- persist events next to the job or session
- expose traces to the UI when they help users understand progress
- use scorers when quality gates are part of the product behavior

## Environment and scripts

Mastra packages should use `@howells/envy` for runtime env and deploy checks.

Useful scripts:

```json
{
  "scripts": {
    "dev": "mastra dev --dir src",
    "build:mastra": "envy run local --schema ../../packages/env/src/schema.ts --from ../../.env -- mastra build --dir src --root .",
    "deploy:server": "pnpm run build:mastra && envy run local --schema ../../packages/env/src/schema.ts --from ../../.env -- mastra server deploy . --skip-build --config ../../.mastra-project.json --env-file ../../.env --yes",
    "deploy:studio": "pnpm run build:mastra && envy run local --schema ../../packages/env/src/schema.ts --from ../../.env -- mastra studio deploy . --skip-build --config ../../.mastra-project.json --env-file ../../.env",
    "typecheck": "tsc --noEmit",
    "test": "envy run local --schema ../../packages/env/src/schema.ts --from ../../.env -- vitest run --passWithNoTests",
    "clean": "rm -rf dist .mastra .turbo"
  }
}
```

Adjust ports and deploy config per repo. Keep env loading explicit. Do not scatter direct `process.env` access outside the env boundary and narrow runtime bootstrap.

## Testing

Mastra code needs focused tests because registration drift is easy.

Test:

- the agents directory contains only explicit agent files
- every expected agent is registered in the Mastra runtime
- agent ids, names, tools, memory, default options, background tasks, and workflows match the intended contract
- supervisor agents can see the specialists they delegate to
- tool ids use the expected naming pattern
- image-generation tools use Motif rather than raw fal.ai clients unless an endpoint is not covered yet
- tool descriptions remain purpose-led
- workflow directories contain only workflow files
- workflows register only multi-step workflows in Studio
- workflows execute against fake drivers
- workflow traces include the expected ordered step events
- schemas normalize old or lenient persisted input only at the storage boundary
- invalid input fails with a useful error

Prefer fake drivers for tests. Real provider calls belong in integration checks or manual Studio verification, not the default unit suite.

## Anti-patterns

Avoid:

- adding Mastra for one prompt
- creating a catch-all agent with dozens of unrelated responsibilities
- putting Mastra runtime code directly in a Next.js route
- using `packages/agents` and `packages/mastra` for the same runtime concern
- hiding tool schemas inside implementation files
- exposing broad transport tools instead of intent-shaped tools
- skipping `.commit()` on workflows
- letting app components depend on Mastra internals
- using raw provider SDKs inside agents when `@howells/ai` should own provider defaults
- relying on remembered Mastra API details instead of current docs

## Checklist

Before shipping an agentic repo:

- agentsurface.dev is linked for broader agentic-development guidance
- `$mastra` has been used to verify current Mastra APIs
- Mastra code lives in a dedicated package when it is more than a toy
- app code calls product services, not Mastra internals
- tools have Zod input and output schemas
- workflows have explicit input and output schemas
- storage and memory are deliberate
- observability produces product-useful traces
- runtime env is validated through `@howells/envy`
- tests cover registration, tools, workflows, and fake-driver execution
- MCP contracts live in their own package when exposed externally
