---
title: "Repo Archetypes"
description: "The handful of repo shapes most new projects start from, from a single-purpose tool to a full product monorepo, and how to pick between them."
---

# Repo Archetypes

Most new repos should start from one of these shapes.

The point is to reduce unnecessary architectural improvisation.

These archetypes are for new TypeScript-first work. PHP/Craft maintenance projects are outside the default scaffold unless explicitly requested.

## 1. Full-Stack Product App

Use this for:

- authenticated product apps
- dashboard-style products
- apps with real database-backed behavior
- products with both UI and backend logic

Default stack:

- Next.js App Router
- `tRPC`
- React Query
- Drizzle
- Neon
- Clerk by default
- bundled UI baseline
- `@howells/envy` when runtime env exists
- `@howells/ai`, Mastra, and MCP packages when agent behavior is product behavior

Typical workspace:

```text
apps/
  web/
  storybook/        # only if shared UI exists
packages/
  db/
  trpc/
  ui/
  typescript-config/
  tailwind-config/
  env/
  motion/
  auth/             # when auth is shared
  ai/               # only for repo-specific logic above @howells/ai
  mastra/           # when Mastra owns agent/workflow runtime behavior
  agents/           # when agent behavior is shared
  mcp/              # when the repo exposes MCP tools or resources
  assets/           # when multiple surfaces share assets
  upload/           # only if needed
```

This is the most common serious-app archetype in your portfolio.

## 2. UI System or Design-System Repo

Use this for:

- shared UI foundations
- component libraries
- token systems
- motion and transition primitives

Default stack:

- scaffold UI-baseline monorepo shape
- Storybook
- playground or docs app

Typical workspace:

```text
apps/
  playground/
  storybook/
  web/              # optional docs/system site
packages/
  ui/
  typescript-config/
  tailwind-config/
  motion/
  transition/
```

This should be the model for new shared UI work, not fresh one-off design system repos.

## 3. Docs or Content Site

Use this for:

- product docs
- developer docs
- editorial or content-led sites with light app behavior

Default stack:

- Next.js
- Fumadocs when the site is really documentation
- plain markdown only when the surface is still small

Typical workspace:

```text
apps/
  web/
packages/
  ui/               # optional shared site components
  content/          # optional if content transforms are non-trivial
```

Do not install a huge application architecture unless the site actually needs it.

## 4. Published Package

Use this for:

- OSS packages
- reusable libraries
- packages with their own docs/demo site

Default stack:

- package at repo root or minimal monorepo
- `tsup` or repo-specific build tooling if needed
- docs/demo site only if the package benefits from one
- Node 24 for development and CI
- Node `>=22` as the runtime floor only when the library does not need Node 24 APIs

Examples in your ecosystem:

- `@howells/stacksheet`
- `@howells/aperto`
- `@howells/envelope`
- `@howells/envy`
- `@howells/lint`
- `@howells/typescript-config`

This archetype should stay lean. Do not force app-style monorepo complexity into a package repo.

## 5. Worker or Service-Heavy System

Use this for:

- multi-service backends
- cron-heavy systems
- background jobs and ingestion pipelines
- systems with multiple deployable runtimes

Default shape:

- `pnpm` monorepo
- shared packages for core logic
- services or workers as their own deployable units
- Railway-style deployment when the system stops fitting a pure Vercel shape

Typical workspace:

```text
apps/
  web/              # optional
  api/              # optional
packages/
  db/
  core/
  jobs/
  storage/
services/
  workers/
  crons/
```

This is closer to a service-heavy media platform model than the UI-system model.

## 6. AI Pipeline or Research Repo

Use this for:

- ingestion pipelines
- model orchestration
- generation workflows
- classifier or embedding jobs

Default stack:

- `tsx`
- `zod`
- `ai`
- `@howells/ai`
- `howells/motif` packages when image generation, editing, media utilities, CLI automation, or MCP image tools are central
- Mastra when the repo needs agent orchestration, workflow state, memory, or observability
- `@modelcontextprotocol/sdk` when the repo exposes MCP tools or resources
- Drizzle if persistence is needed
- the house media storage packages if generated assets are stored
- `mastra`, `agents`, `mcp`, or `cli` packages when the repo exposes reusable agent tooling
- `@howells/srcfull` if browser or page-source ingestion is central

These repos usually need stronger script and data-pipeline conventions than typical UI apps.

## Choosing Between Archetypes

Use these defaults:

- product app: full-stack product app
- shared components: UI system repo
- docs-first surface: docs or content site
- reusable library: published package
- multiple workers/services: worker or service-heavy system
- model workflows and ingestion: AI pipeline or research repo

If a repo looks like two archetypes at once, choose the dominant one and add the secondary capabilities carefully. Do not mash two entire architectures together by default.
