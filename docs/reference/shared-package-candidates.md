---
title: "Shared Package Candidates"
description: "Which packages are already real shared assets versus patterns that only look ready to extract, and the bar a candidate clears before it moves."
---

# Shared Package Candidates

This section separates packages that are already real shared assets from patterns that look ready to become them.

## Already Shared and Real

These should be treated as canonical shared packages now:

- `@howells/lint`
  - pinned Oxlint/Oxfmt, Biome, Ultracite, and React Doctor presets
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
- `@howells/motif-mcp`
  - MCP tools and resources for image generation, editing, utility media actions, model metadata, and history
- `@howells/envy`
  - typed env parsing, lint helpers, and deployment env preflight checks
- `@howells/stow-server`
  - the reusable server integration surface when a repo needs to talk to the house media storage platform directly
- `@howells/stow-next`
  - the reusable Next.js-facing media storage integration
- `@howells/srcfull`
  - shared source-fetching layer for browser/page-source ingestion workflows

## Keep Standardizing: AI Provider Baseline

`@howells/ai` is already common enough to be the default provider baseline for AI-capable repos.

Recommendation:

- keep provider selection, model defaults, and shared AI SDK wiring in `@howells/ai`
- keep product-specific prompts, tools, and workflows in repo-local `packages/ai` or `packages/agents`
- do not publish repo-specific agent packages just because several repos use Mastra

Mastra and MCP should standardize as architecture choices before becoming more shared package surface.

## Keep Standardizing: Image Generation Surface

`howells/motif` should be the default surface for fal.ai image generation, image editing, upscaling, background removal, image-to-video, model metadata, dry runs, cost estimates, structured CLI output, and MCP image tools.

Recommendation:

- use `@howells/motif-sdk` for product or package code
- use `@howells/motif-cli` for scriptable local and agent workflows
- use `@howells/motif-mcp` when other agents need image-generation tools through MCP
- keep durable media storage separate through the house media storage platform
- do not write raw fal.ai clients in app routes unless Motif cannot cover the endpoint yet

## Strong Candidate: Motion Tokens Package

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

## Strong Candidate: Transition Primitives

The bundled transition snapshot suggests another promising shared layer.

Why:

- transitions and overlay enter/exit behavior are recurring
- the same interaction patterns reappear across UI repos
- keeping transition primitives separate from raw components is cleaner than burying them inside each app

Recommendation:

- stabilize transition primitives inside repos that need them
- only publish them separately if they prove reusable outside one product family

## Medium Candidate: Shared Drawer and Sidepanel Layer

You have repeated `vaul` wrappers across several active UI repos.

That is a signal.

Recommendation:

- do not publish a generic drawer package yet
- first collapse the repeated wrappers into the scaffold UI baseline or a repo-local shared UI package
- publish only if that API becomes stable and broadly useful outside your repos

For now:

- keep simple drawers in shared UI packages
- use `@howells/stacksheet` when the flow becomes stack-oriented

## Not a Good Shared Package Candidate Yet

These are useful patterns, but they should stay repo-local for now:

- repo-local env packages
- project-local domain packages
- repo-specific auth wrappers
- repo-specific TRPC wrappers

They encode app boundaries, not cross-project standards.

The env exception is implementation, not ownership: keep a repo-local `packages/env` boundary, but build it on `@howells/envy` instead of publishing another env package per app.

## Product Recommendation vs Package Recommendation

There is an important distinction here:

- the house media storage platform is the product recommendation
- `@howells/stow-server` is the package recommendation

For new projects, the default decision should be:

- if the repo needs image, vector, or media storage, start by asking whether it should use the house media storage platform
- if the repo needs typed server-side integration, reach for `@howells/stow-server`
- if package code needs portable object/blob operations, put `files-sdk` inside the storage/upload package rather than calling S3, R2, GCS, Azure Blob, Vercel Blob, or similar provider clients directly from apps

## Practical Standardization Order

If you want to reduce duplicated package work across the portfolio, the best order is:

1. prefer `@howells/lint` and `@howells/typescript-config` everywhere
2. use `@howells/envy` for repo-local env boundaries instead of creating more package-specific env tooling
3. keep `@howells/ai` as the shared AI/provider baseline instead of scattering raw provider clients
4. use `howells/motif` for image generation and media utility workflows instead of scattering raw fal.ai clients
5. standardize `@howells/stacksheet` as the default stacked-panel abstraction
6. unify motion tokens into one shared package
7. stabilize the bundled UI baseline through real consuming repos before publishing more UI internals

That order reduces duplication without locking in the wrong abstractions too early.
