---
title: "Overview"
description: "Howells defaults for repo shape, stack, package boundaries, agent workflow, and launch checks."
---

# New project docs

These are the current Howells project defaults:

- the bundled UI baseline for shared UI, tokens, motion, and Storybook
- native coding-assistant workflows and Matt Pocock's skills for general software development
- the independent skills collection for specialist work that should not live inside one product repo
- `@howells/lint` for pinned Oxlint/Oxfmt linting and formatting
- `@howells/typescript-config` for thin, explicit tsconfig presets
- `@howells/envy` for typed env parsing and deployment env checks
- `@howells/ai`, Mastra, and deliberately scoped MCP packages for AI-capable product and agent work
- Motif's SDK and agent-readable CLI for image generation, image editing, utility media tools, and creative automation
- conservative Turborepo defaults through the root `turbo.json` snippet

## Defaults

- Default repo shape: `pnpm` monorepo, usually with `apps/*` and `packages/*`
- Default UI stack: Next.js App Router, React, Tailwind CSS v4, Base UI, and Storybook when the repo exports reusable UI; unified Radix is the deliberate opt-out
- Default linting and formatting: prefer the `@howells/lint` Oxlint/Oxfmt lane
- Default task runner: Turborepo with cache disabled until a repo proves it is deterministic
- Default data stack for product apps: Drizzle and Neon, with the narrowest typed API boundary that fits and React Query when client server-state exists
- Default AI-capable shape: shared provider baseline through `@howells/ai`, image generation through Motif, product orchestration through repo-local `ai` or `agents`, and MCP in its own package only when the product needs that protocol surface

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
- [Development Skills](./reference/development-skills.md)
- [Worktree Coordination](./reference/worktree-coordination.md)
- [Agentic Development](./reference/agentic-development.md)
- [Launch Checklist](./reference/launch-checklist.md)

## Agent skill

The Project Docs are the source of truth. The installable skill at `skills/scaffold` is a distribution surface that routes supported coding assistants through these docs without loading every reference at once.

## What this standard optimises for

- Low config drift across active repos
- Fast project setup without re-deciding toolchain basics
- Correctness over cleverness
- Shared UI primitives without flattening project identity
- Short agent instructions that prevent ambiguity and drift
- Reusable skills that stay independent when they solve cross-repo agent problems
