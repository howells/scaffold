# Package boundaries

These boundaries keep shared infrastructure out of app code. They come from active TypeScript projects; PHP and Craft maintenance repos do not set this baseline.

## Default boundaries for a full-stack app

For a product app, start with:

```text
apps/
  web/
packages/
  db/
  trpc/             # only when the app uses tRPC
  ui/
  env/
  tailwind-config/
  motion/
```

Add more only when the product clearly needs them.

## Dependency direction

The package graph should have an obvious direction:

- apps may depend on packages, but never on other apps
- packages never import from apps
- cross-package imports go through deliberate public exports, not another package's internal files
- lower-level infrastructure does not depend on product-specific UI or route code

Prefer a named domain boundary over a generic `shared` package. Enforce the graph in code with `@howells/boundaries` when a repo has enough packages for accidental imports to become likely.

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

## TypeScript config

Don't create a local `packages/typescript-config`. Each app and package `tsconfig.json` extends the matching `@howells/typescript-config` preset directly.

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

## Add only when needed

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

Generated asset metadata can point at Motif runs, model IDs, prompts, references, or output files, but do not put Motif client implementation here. Keep generation calls in `packages/mastra` or a product service that uses `@howells/motif-sdk`.

### `packages/upload` or `packages/storage`

Use when:

- the repo has serious upload or media behavior
- media storage integration is not isolated to one small feature
- object/blob storage needs provider portability, agent file tools, or shared upload/download/list/delete behavior

Use `files-sdk` as the default SDK inside this boundary when the repo needs to talk to S3, R2, GCS, Azure Blob, Vercel Blob, Netlify Blobs, MinIO, or similar providers through one API. Keep the `Files` instance, provider adapter configuration, key naming, metadata policy, and approval-sensitive operations here. Export product-level functions; do not leak native provider clients or adapter setup into app routes.

### `packages/mastra`

Use when the repo needs agents, tools, workflows, memory, storage, observability, scorers or processors, and agent behaviour is more than a single prompt or server action.

Keep it organised by runtime concern: `agents`, `tools`, `workflows`, `schemas`, `prompts`, `runtime`, `observability`, `scorers`, `processors` and `mcp` for the Mastra MCP server. Models come from `@howells/ai` by size. Run Studio from this package; add `apps/mastra-studio` only when the Studio is deployed.

App routes and React components should not import Mastra internals. Put dispatch and polling behind product services, and expose only deliberate package exports.

See [Agentic Development](./agentic-development.md) before adding this package.

### `packages/mcp`

Use only for a standalone MCP server that serves product tools without Mastra, built on `@modelcontextprotocol/sdk` and served from an app route. A repo whose MCP surface is its Mastra tools keeps the server in `packages/mastra`.

For image-generation tools, prefer Motif's SDK or CLI before creating a fresh protocol surface. Add an MCP server only when a client needs it and the CLI cannot serve it.

### `packages/cli`

Use when:

- agent or operations workflows need a first-class command line
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

## Keep in `apps/web`

Keep these app-local:

- routes
- page compositions
- app-specific loaders/actions
- product-specific UI assembly
- local feature folders that are not reused anywhere else

The app should assemble shared infrastructure, not own it.

## Do not extract

Do not create packages for:

- one tiny helper
- one feature used once
- speculative future reuse
- vague categories like `shared`, `common`, or `utils` without a real boundary

A package must express a dependency boundary.

## Signs of a useful boundary

- multiple apps depend on it
- changing it should not require editing route files directly
- it has a coherent reason to exist
- it reduces duplication without hiding behavior

## Signs of a weak boundary

- everything imports everything
- package names are generic and meaningless
- moving code into the package did not reduce coupling
- the package exists only because monorepos are fashionable

## Priority order

Create boundaries in this order:

1. `db`
2. `ui`
3. `env`
4. `tailwind-config`
5. `motion`
6. `trpc` when a same-workspace typed API needs it
7. `mastra` when agent behavior is part of the product; `mcp` only for a standalone read-only server
