---
title: "Architecture defaults"
description: "The recurring architecture choices across my active repos: a domain core, thin app clients, typed boundaries, and where orchestration lives."
---

# Architecture defaults

These defaults come from active TypeScript, UI, data, and agent repositories. PHP and Craft maintenance projects do not set the baseline for new work.

## Full-stack TypeScript app

For a serious TypeScript product app, the recurring stack is:

- Next.js App Router
- the narrowest typed API boundary that fits the actual consumers
- `@tanstack/react-query` for client data orchestration when client server-state exists
- Drizzle for the database layer
- Neon Postgres via `@neondatabase/serverless`

### Choose the API seam

| Consumer shape | Default seam |
| --- | --- |
| One Next.js app, no reusable external API | Server Components, server actions, or a focused typed service |
| Same-workspace TypeScript clients | `tRPC`, optionally with React Query |
| Separate deployables or non-TypeScript clients | A versioned OpenAPI contract, with oRPC as the TypeScript-first option |

Do not create an API layer merely to make the diagram look complete. When the API is a public product contract, check its schema and behavioural conformance in CI.

### When tRPC is the right seam

Use `tRPC` when:

- the app is TypeScript end to end
- you want typed procedures across server and client
- the team is comfortable with a monorepo or shared package boundary
- the product has database-backed behaviour that benefits from typed procedures

### When not to use tRPC

Do not force `tRPC` into:

- static marketing sites
- documentation sites
- tiny apps with only one or two trivial endpoints
- repos where the API must be intentionally language-agnostic from day one

When the API must emit OpenAPI or stay language-agnostic, use oRPC as the default TypeScript-first alternative. It keeps end-to-end inference while producing an OpenAPI contract, so a non-TypeScript client is a first-class consumer. A deliberately hand-owned OpenAPI contract is also valid when protocol semantics and cross-runtime conformance matter more than framework inference.

### Route composition

Keep App Router route files server-first. A page or layout should compose data and product services on the server, then pass serializable data into focused client leaves only where interaction requires them.

- keep authentication and mutations behind a server boundary
- start independent data reads together and await them together
- avoid turning a whole route into a client component for one interactive control
- move reusable business, agent, and transport contracts into a package or domain module instead of defining them inside route handlers

## Database and persistence

Use:

- Postgres
- Drizzle (ORM + typed schema)
- Neon for serverless-hosted Postgres
- **`@howells/neon`** as the client layer; never hand-roll drivers. It wraps `@neondatabase/serverless` (HTTP) and `pg` (TCP) with write-safe retries, IPv4-first DNS, cold-start timeouts, HMR-safe caching, and endpoint guards.

Use Drizzle from day one. Hand-written SQL with manual row typing is an exception.

### Connect Drizzle to Neon

Pick the subpath by runtime, not by habit:

- **Default: `@howells/neon/http`** (`createHttpDb({ url, schema })`, neon-http adapter). Use for app data access (Server Components, route handlers, serverless functions, Workers) and short-lived scripts. HTTP one-shot queries suit request/response work, and `db.batch([...])` provides atomic non-interactive writes for most write paths.
- **Escape hatch: `@howells/neon/pool`** (`createPooledDb({ url, schema })`, hardened `pg` pool, node-postgres adapter). Use for _interactive_ transactions with mid-transaction branching, `LISTEN/NOTIFY`, or long-running batch work. Neon HTTP's `.transaction()` **typechecks but throws at runtime**; a package that calls it belongs on `/pool`.
- **Avoid: `drizzle-orm/neon-serverless`** (the WebSocket `Pool`). It drops idle sockets on autosuspend and leaks pools across HMR. Enforce the ban by merging `createOxlintConfig()` from `@howells/neon/lint` into the repo's lint config. Edge runtimes that require the WS pool (`neonConfig.poolQueryViaFetch`) are the exception.

Do not mix subpaths within a package without a recorded reason. Avoid `postgres.js` and hand-rolled `pg` clients. See [Neon](./neon.md) for the failure analysis and repo survey.

### Schema and migrations

- **Schema-first.** The Drizzle schema (`packages/db/src/schema.ts`) is the source of truth.
- **Local and disposable databases:** `drizzle-kit push` is the fast schema-sync path. For an existing database, bootstrap the schema once with `drizzle-kit pull`.
- **Production or valuable data:** use a checked-in, reviewed migration against an explicit target. Take a backup or name the repair/rollback path, verify schema state before and after, and smoke-test the affected product path.
- Generated migrations are preferred when they are trustworthy. Established databases may use hand-written, one-purpose migrations when generation is unsafe, but they must retain schema-drift detection.
- Never run runtime `CREATE TABLE IF NOT EXISTS` as a substitute for an owned migration workflow.
- Schema lives in the first-tier `packages/db` boundary.

### Driver notes (GA `@neondatabase/serverless`)

- Requires Node ≥ 19 (all current repos are well past this).
- Call the neon query function as a **template** (`` sql`…` ``) or via `.query(text, params)` — never as a conventional function `sql('…', [])` (the GA breaking change).
- Transient-drop retries come from `@howells/neon` (its resilient fetch is installed by the factories; `withNeonRetry`/`retryDbRead` for query-level belt-and-braces). Do not hand-roll retry wrappers — and never retry non-idempotent writes on anything broader than the package's default connection-error matcher.

## Client state

Use state tools by scope:

- server data: `@tanstack/react-query`
- local cross-component UI state: `zustand`
- URL state: `nuqs` when the app benefits from URL-driven state

Do not use Zustand as a replacement for server data fetching.

## Authentication

The recurring choices are split by product type:

- Clerk for standard app authentication
- WorkOS when the app has enterprise or org-oriented auth requirements

Guideline:

- default to Clerk for user auth in new product apps
- reach for WorkOS when the product clearly needs SSO, org management, or enterprise identity flows

Do not treat both as default dependencies in the same new repo.

## Documentation sites

When a project needs a proper docs site, the recurring answer is:

- Fumadocs

That already appears in the existing docs-style surfaces across the portfolio.

Use it when:

- the repo is already on Next.js
- the docs are part of the product or developer experience
- search, navigation, and polished docs UX matter

Do not scaffold a docs framework into every repo by default.

## Shared UI development

When the repo owns reusable UI:

- keep shared components in a package
- use Storybook as the visual contract
- seed new UI-first work from the bundled UI baseline

Storybook is not mandatory for every app. It is mandatory when the repo exports reusable UI that should be reviewed and regression-checked in isolation.

## Component scaffolding

The recurring pattern is:

- use `shadcn` as a generator
- do not treat `shadcn` output as the design system

That means:

- generate components when it accelerates setup
- immediately align them to shared tokens, wrappers, and repo conventions
- fold recurring generic improvements back into the scaffold baseline where appropriate

Scaffold on Base UI. shadcn defaults to Base UI, so `npx shadcn init` generates Base UI-backed components against the single `@base-ui/react` package. Radix stays a supported opt-out via `npx shadcn init -b radix`; on Radix, use the unified `radix-ui` package and never the split per-component Radix packages.

## Media and asset storage

For projects with serious image, vector, or media needs:

- use `howells/motif` for image generation, editing, utility media tools, and agent-facing creative automation
- use the house media storage platform as the default product recommendation
- use `files-sdk` as the default object/blob-store abstraction inside storage packages when code needs to support S3, R2, GCS, Azure Blob, Vercel Blob, Netlify Blobs, MinIO, or similar backends through one API
- use `@howells/stow-server` when a reusable server integration layer is needed
- use `@howells/stow-next` when a Next.js app needs the app-facing media storage integration

Keep the distinction clear: Motif owns generation, editing, upscaling, background removal, image-to-video, model metadata, dry runs, and structured agent-facing CLI output. The storage platform owns durable storage and delivery. `files-sdk` owns the provider-neutral object/blob-store calls underneath a repo-local storage or upload boundary, not ad hoc provider clients in app routes.

## AI-enabled apps

For apps with AI features:

- `ai` (the AI SDK) for the application-facing AI SDK surface
- `@howells/ai` as the shared AI SDK/provider baseline
- `howells/motif` for fal.ai image-generation and media-utility surfaces
- `zod` for structured input and output contracts

Keep model access behind `@howells/ai`. Its current package-level default route is Vercel AI Gateway, but that benchmark-informed default is not an architectural requirement for every product. Choose Gateway, OpenRouter, or a direct provider deliberately when deployment, first-party features, routing policy, credentials, or observability make the distinction material. Keep that choice in `@howells/ai` or `packages/ai`, not scattered through app routes.

If the repo is doing CLI-model orchestration or needs stricter typed IO around agent calls:

- consider `@howells/envelope`

Add Mastra when the repo needs agent orchestration:

- `@mastra/core` for agent and workflow foundations
- `mastra` for the CLI/dev runtime
- `@mastra/pg`, `@mastra/memory`, or `@mastra/observability` only when those capabilities are present

Put substantial Mastra code in `packages/mastra`, not inside an app route or a generic `packages/agents` boundary. See [Agentic Development](./agentic-development.md).

Use raw provider SDKs only behind a boundary:

- default provider wiring belongs in `@howells/ai`
- project-specific provider composition belongs in `packages/ai`
- app routes should call product services, not create raw OpenAI, Anthropic, or OpenRouter clients inline

## Runtime environment

Use `@howells/envy` when an app depends on runtime env.

The default shape is a `packages/env` boundary that owns schema definition, parsing, generated Next.js server/client modules, lint helper config, and provider preflight checks. App code should import typed env exports rather than reading `process.env` directly.

## Agent and MCP surfaces

Agent-heavy repos use explicit package boundaries for tool surfaces:

- `packages/ai` for repo-specific model/provider composition above `@howells/ai`
- `packages/mastra` for Mastra runtime code, agents, tools, workflows, storage, memory, observability, scorers, and runtime routes
- `packages/agents` for reusable non-Mastra agent definitions, evaluators, prompts, and tool wiring
- `packages/mcp` or `packages/mcp-server` for MCP server contracts and transport code
- `packages/cli` when the agent or ingestion surface needs a first-class command line

Use `zod` for tool and transport schemas, and keep provider plumbing behind `@howells/ai` instead of scattering raw AI SDK clients through app code.

Use `@modelcontextprotocol/sdk` when the repo exposes MCP tools or resources. Do not bury MCP tool contracts inside a Next.js route unless the route is the only consumer and there is no expected CLI, test, or agent reuse.

## Ingestion and enrichment

For source-heavy or scraper-heavy repos:

- use a dedicated `ingestion`, `enrichment`, or `scraper` package when pipeline behavior becomes substantial
- consider `@howells/srcfull` for browser/page-source extraction before building a fresh source-fetching layer

## Overlay model

Use the overlay primitives deliberately:

- ordinary drawer or sheet: shared `vaul`-backed drawer layer
- stacked sheets or nested panel drills: `@howells/stacksheet`
- thumbnail-to-expanded image or video transitions: `@howells/aperto`

Do not stretch a basic drawer into a multi-layer workflow.

## Default product stack

For a new product app, use:

- Next.js
- the API seam appropriate to the consumers
- React Query
- Drizzle
- Neon
- WorkOS by default; Clerk for a lighter existing or consumer-oriented app with a recorded reason
- the bundled UI baseline
- `@howells/ai` plus Mastra/MCP packages when agent behavior is part of the product
- Envy if runtime env exists
- Storybook if shared UI exists
- Fumadocs if the repo needs docs
- the house media storage packages if the repo needs media storage

Record any deviation and the product constraint behind it.

See also:

- [Repo Archetypes](./repo-archetypes.md)
- [Package Boundaries](./package-boundaries.md)
- [Deployment Defaults](./deployment-defaults.md)
