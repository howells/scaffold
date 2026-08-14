# Package Boundaries

These are the package boundaries that keep recurring across your serious monorepos.

The goal is not maximal modularity. The goal is to stop app code from swallowing shared infrastructure and then becoming impossible to reuse or reason about.

For new scaffolds, derive these boundaries from TypeScript projects only. Legacy PHP/Craft repos do not set the default package model.

## Default Boundaries for a Full-Stack App

For a real product app, this is the clean default:

```text
apps/
  web/
packages/
  db/
  trpc/             # only when the app uses tRPC
  ui/
  typescript-config/
  tailwind-config/
  env/
  motion/
```

Add more only when the product clearly needs them.

## Dependency Direction

The package graph should have an obvious direction:

- apps may depend on packages, but never on other apps
- packages never import from apps
- cross-package imports go through deliberate public exports, not another package's internal files
- lower-level infrastructure does not depend on product-specific UI or route code

Prefer a named domain boundary over a generic `shared` package. Enforce the graph in code with `@howells/boundaries` and the `fenceline` skill when a repo has enough packages for accidental imports to become likely.

## `packages/db`

Put these here:

- Drizzle schema
- Drizzle client
- migrations
- db helpers
- database-specific query utilities

Do not scatter raw DB access across multiple app folders.

## `packages/trpc`

Put these here:

- router definitions
- procedure helpers
- shared API types
- React Query integration helpers for `tRPC`

If the repo uses `tRPC`, this package should be the boundary between app UI and server procedures.

## `packages/ui`

Put these here:

- reusable primitives
- reusable compositions
- shared hooks tied to UI behavior
- shared styles and UI utilities

Do not put page-specific product UI here just because it uses shared components.

## `packages/typescript-config`

Put this here when the repo has multiple leaves that should share explicit presets:

- app presets
- package presets
- test-specific presets only if the repo truly needs them

This now recurs enough that it should be considered part of the default monorepo shape, not an afterthought.

## `packages/tailwind-config`

Put these here:

- shared Tailwind CSS setup
- shared stylesheets
- design-token wiring for apps and UI packages

If multiple apps or packages consume the same styling baseline, keep that contract here instead of duplicating CSS setup.

## `packages/env`

Put these here:

- env schema
- server/client env parsing
- typed env exports
- Envy setup and generated Next.js env boundary files

Use `@howells/envy` as the default implementation. Do not read `process.env` throughout the codebase outside this boundary.

## `packages/motion`

Put these here:

- durations
- easings
- springs
- motion presets

This boundary now recurs enough that it should be deliberate, not accidental.

## Add These Only When Needed

### `packages/auth`

Use when:

- auth logic is non-trivial
- multiple apps or packages depend on auth behavior

Do not extract this too early in a small repo.

### `packages/assets`

Use when:

- multiple apps or packages consume the same images, icons, or generated asset metadata
- design-system or product surfaces need a shared asset contract

This shows up often enough that it should be a deliberate choice when a repo has more than one surface.

Generated asset metadata can point at Motif runs, model IDs, prompts, references, or output files, but do not put Motif client implementation here. Keep generation calls in `packages/ai`, `packages/agents`, `packages/mastra`, `packages/mcp`, or a product service that uses `@howells/motif-sdk`.

### `packages/upload` or `packages/storage`

Use when:

- the repo has serious upload or media behavior
- media storage integration is not isolated to one small feature
- object/blob storage needs provider portability, agent file tools, or shared upload/download/list/delete behavior

Use `files-sdk` as the default SDK inside this boundary when the repo needs to talk to S3, R2, GCS, Azure Blob, Vercel Blob, Netlify Blobs, MinIO, or similar providers through one API. Keep the `Files` instance, provider adapter configuration, key naming, metadata policy, and approval-sensitive operations here. Export product-level functions; do not leak native provider clients or adapter setup into app routes.

### `packages/ai`

Use when:

- repo-specific models, prompts, adapters, or orchestration logic need a home above one app
- more than one surface depends on the same model logic

Use `@howells/ai` as the shared baseline before creating fresh provider wrappers here. This package can compose `ai`, provider adapters, model registries, and app-specific structured-output helpers, but it should not become a place for domain business logic.

When repo-specific image generation belongs with the model layer, use `@howells/motif-sdk` here instead of raw fal.ai clients.

### `packages/agents`

Use when:

- agent definitions, evaluators, prompts, or tool wiring are reused by more than one surface
- model-facing orchestration has become more than a single app feature

Keep provider setup behind `@howells/ai`; this package should own product-specific agent behavior.

Use this for non-Mastra agent assets. When Mastra owns runtime orchestration, prefer `packages/mastra`.

### `packages/mastra`

Use when:

- the repo needs Mastra agents, tools, workflows, memory, storage, observability, scorers, processors, or Studio inspection
- agent behavior is more than a single prompt or simple server action
- workflows need durable runs, traces, or background execution
- app code needs to dispatch jobs to a local or remote Mastra runtime

Keep `packages/mastra` organized by runtime concern: `agents`, `tools`, `workflows`, `schemas`, `prompts`, `runtime`, `observability`, `scorers`, and `processors`.

App routes and React components should not import Mastra internals. Put dispatch and polling behind product services, and expose only deliberate package exports.

See [Agentic Development](./agentic-development.md) before adding this package.

### `packages/mcp` or `packages/mcp-server`

Use when:

- the repo exposes MCP tools or resources
- tool schemas, transports, or server setup need to be shared with apps, CLIs, or tests

Do not bury MCP server contracts inside a web app route if another surface needs to consume or test them.

Use `@modelcontextprotocol/sdk` here rather than hand-rolling protocol objects.

For image-generation tools, prefer wrapping or configuring `@howells/motif-mcp` before creating a fresh MCP server surface.

### `packages/cli`

Use when:

- ingestion, agent, or operations workflows need a first-class command line
- scripts have grown into reusable commands with options, validation, and tests

Do not create this for one-off maintenance scripts.

### `packages/core`

Use when:

- the repo has substantial shared non-UI business logic

Do not create `core` as a junk drawer.

### `packages/utils`

Use sparingly for:

- genuinely shared, low-level helpers with no stronger domain home

Do not let `utils` become the first place code goes. In your repos it exists often, but it is weaker than `db`, `ui`, `trpc`, `auth`, or `ai` as a boundary.

## What Should Stay in `apps/web`

Keep these app-local:

- routes
- page compositions
- app-specific loaders/actions
- product-specific UI assembly
- local feature folders that are not reused anywhere else

The app should assemble shared infrastructure, not own it.

## What Not to Extract

Do not create packages for:

- one tiny helper
- one feature used once
- speculative future reuse
- vague categories like `shared`, `common`, or `utils` without a real boundary

If a package does not express a real dependency boundary, it is probably cargo-cult modularity.

## Good Signs a Boundary Is Real

- multiple apps depend on it
- changing it should not require editing route files directly
- it has a coherent reason to exist
- it reduces duplication without hiding behavior

## Bad Signs a Boundary Is Fake

- everything imports everything
- package names are generic and meaningless
- moving code into the package did not reduce coupling
- the package exists only because monorepos are fashionable

## Strong Defaults

If you do nothing else right, get these boundaries right first:

1. `db`
2. `ui`
3. `typescript-config`
4. `tailwind-config`
5. `motion`
6. `env`
7. `trpc` when a same-workspace typed API needs it
8. `ai` / `mastra` / `agents` / `mcp` when agent behavior is part of the product

That is where the portfolio already shows a durable pattern.
