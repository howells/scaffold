---
title: "Shared package candidates"
description: "Which shared packages are established, which remain candidates, and when to extract one."
---

# Shared package candidates

Separate established packages from patterns that still need evidence.

## Established packages

These should be treated as canonical shared packages now:

- `@howells/lint`
  - pinned Oxlint/Oxfmt, Ultracite, and React Doctor presets
- `@howells/typescript-config`
  - explicit thin tsconfig presets
- `@howells/stacksheet`
  - the preferred abstraction for stacked sheet flows
- `@howells/envelope`
  - strict structured IO wrapper for CLI-model workflows
- `@howells/ai`
  - shared AI SDK/provider baseline for AI-capable apps and agent packages
- `@howells/motif-sdk`
  - shared fal.ai image-generation, editing, utility media, model registry, and cost-estimation surface
- `@howells/motif-cli`
  - agent-friendly image-generation CLI with dry runs, structured output, local history, and series workflows
- `@howells/envy`
  - typed env parsing, lint helpers, and deployment env preflight checks
- `@howells/stow-server`
  - the reusable server integration surface when a repo needs to talk to the house media storage platform directly
- `@howells/stow-next`
  - the reusable Next.js-facing media storage integration
- `@howells/srcfull`
  - shared source-fetching layer for browser/page-source ingestion workflows

## Continue standardising: AI provider baseline

`@howells/ai` is already common enough to be the default provider baseline for AI-capable repos.

Recommendation:

- keep provider selection, model defaults, and shared AI SDK wiring in `@howells/ai`
- keep product-specific prompts, tools, and workflows in repo-local `packages/ai` or `packages/agents`
- do not publish repo-specific agent packages just because several repos use Mastra

Mastra and MCP should standardize as architecture choices before becoming more shared package surface.

## Continue standardising: image generation

Motif should be the default surface for fal.ai image generation, image editing, upscaling, background removal, image-to-video, model metadata, dry runs, cost estimates, and structured agent-facing command-line work.

Recommendation:

- use `@howells/motif-sdk` for product or package code
- use `@howells/motif-cli` for scriptable local and agent workflows
- use the CLI's JSON/NDJSON output, semantic exit codes, and live `--describe` schema when an agent needs the tool surface
- keep durable media storage separate through the house media storage platform
- do not write raw fal.ai clients in app routes unless Motif cannot cover the endpoint yet

## Strong candidate: motion tokens

This is the clearest next shared package candidate.

Why:

- `motion` is one of the highest-frequency UI dependencies
- the bundled UI baseline includes a small motion package snapshot
- both repos are solving the same problem: durations, easings, springs, presets

Recommendation:

- converge on one shared motion token package instead of letting every major UI repo carry its own copy

This package should be small and boring:

- durations
- easings
- springs
- a few named presets

It should not become a second animation library.

## Strong candidate: transition primitives

The bundled transition snapshot suggests another promising shared layer.

Why:

- transitions and overlay enter/exit behavior are recurring
- the same interaction patterns reappear across UI repos
- keeping transition primitives separate from raw components is cleaner than burying them inside each app

Recommendation:

- stabilize transition primitives inside repos that need them
- only publish them separately if they prove reusable outside one product family

## Medium candidate: drawer and side-panel layer

You have repeated `vaul` wrappers across several active UI repos.

That is a signal.

Recommendation:

- do not publish a generic drawer package yet
- first collapse the repeated wrappers into the scaffold UI baseline or a repo-local shared UI package
- publish only if that API becomes stable and broadly useful outside your repos

For now:

- keep simple drawers in shared UI packages
- use `@howells/stacksheet` when the flow becomes stack-oriented

## Keep local for now

These are useful patterns, but they should stay repo-local for now:

- repo-local env packages
- project-local domain packages
- repo-specific auth wrappers
- repo-specific TRPC wrappers

They encode app boundaries, not cross-project standards.

The env exception is implementation, not ownership: keep a repo-local `packages/env` boundary, but build it on `@howells/envy` instead of publishing another env package per app.

## Product and package choices

Keep these choices separate:

- the house media storage platform is the product recommendation
- `@howells/stow-server` is the package recommendation

For new projects, the default decision should be:

- if the repo needs image, vector, or media storage, start by asking whether it should use the house media storage platform
- if the repo needs typed server-side integration, reach for `@howells/stow-server`
- if package code needs portable object/blob operations, put `files-sdk` inside the storage/upload package rather than calling S3, R2, GCS, Azure Blob, Vercel Blob, or similar provider clients directly from apps

## Standardisation order

Reduce duplicated package work in this order:

1. prefer `@howells/lint` and `@howells/typescript-config` everywhere
2. use `@howells/envy` for repo-local env boundaries instead of creating more package-specific env tooling
3. keep `@howells/ai` as the shared AI/provider baseline instead of scattering raw provider clients
4. use `howells/motif` for image generation and media utility workflows instead of scattering raw fal.ai clients
5. standardize `@howells/stacksheet` as the default stacked-panel abstraction
6. unify motion tokens into one shared package
7. stabilize the bundled UI baseline through real consuming repos before publishing more UI internals
