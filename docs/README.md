---
title: "New Project Docs"
description: "This docs set is the canonical starting point for a new Howells project."
---

# New Project Docs

This docs set is the canonical starting point for a new Howells project.

It is not a generic starter guide. It reflects the conventions that are already converging across your recently active repos:

- the bundled UI baseline for shared UI, tokens, motion, and Storybook
- Arc for the software delivery lifecycle across vision, ideation, implementation, testing, review, audit, launch, and commit workflows
- the independent skills collection for specialist work that should not live inside one product repo
- `@howells/lint` for pinned Oxlint/Oxfmt linting and formatting
- `@howells/typescript-config` for thin, explicit tsconfig presets
- `@howells/envy` for typed env parsing and deployment env checks
- `@howells/ai`, Mastra, and MCP packages for AI-capable product and agent work
- `howells/motif` packages for image generation, image editing, utility media tools, and agent-facing creative automation
- conservative Turborepo defaults through the root `turbo.json` snippet

## Defaults

- Default repo shape: `pnpm` monorepo, usually with `apps/*` and `packages/*`
- Default UI stack: Next.js 16.2 App Router, React 19.2, Tailwind CSS 4.3, Radix, and Storybook when the repo exports reusable UI
- Default linting and formatting: prefer the `@howells/lint` Oxlint/Oxfmt lane
- Default task runner: Turborepo with cache disabled until a repo proves it is deterministic
- Default data stack for product apps: Drizzle, Neon, `tRPC`, and React Query
- Default AI-capable shape: shared provider baseline through `@howells/ai`, image generation through `howells/motif`, product orchestration through repo-local `ai` or `agents`, and MCP in its own package when exposed

## Sections

- [Principles](./principles.md)
- [Getting Started](./getting-started.md)
- [Stack Decisions](./reference/stack-decisions.md)
- [Architecture Defaults](./reference/architecture-defaults.md)
- [Repo Archetypes](./reference/repo-archetypes.md)
- [Package Boundaries](./reference/package-boundaries.md)
- [Deployment Defaults](./reference/deployment-defaults.md)
- [Default Dependencies](./reference/default-dependencies.md)
- [Config Snippets](./reference/config-snippets.md)
- [UI Projects](./reference/ui-projects.md)
- [Shared Package Candidates](./reference/shared-package-candidates.md)
- [Agent Workflow](./reference/agent-workflow.md)
- [Agentic Development](./reference/agentic-development.md)
- [Launch Checklist](./reference/launch-checklist.md)

## Agent Skill

The Project Docs are the source of truth. The installable skill at `skills/scaffold` is a distribution surface that routes supported coding assistants through these docs without loading every reference at once.

## What This Standard Optimizes For

- Low config drift across active repos
- Fast project setup without re-deciding toolchain basics
- Correctness over cleverness
- Shared UI primitives without flattening project identity
- Clear agent workflows so Arc and supported coding assistants remain assets instead of entropy generators
- Reusable skills that stay independent when they solve cross-repo agent problems
