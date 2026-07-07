---
title: "UI Projects"
description: "For new UI-based projects, the default is a local UI package seeded from the scaffold's bundled UI baseline."
---

# UI Projects

For new UI-based projects, the default is a local UI package seeded from the scaffold's bundled UI baseline.

That is the key decision in this scaffold: the shared shape lives here, not in a separate upstream repo.

## What The Bundled Baseline Owns

The scaffold now includes the old UI-system files directly under [Bundled UI Baseline](./ui-baseline/README.md). Use those files as a starting point for:

- `packages/ui` for primitives and shared compositions
- `packages/tailwind-config` for tokens and shared CSS entrypoint
- `packages/motion` for shared motion constants and helpers
- `packages/transition` for transition primitives
- `apps/storybook` as the visual contract
- `apps/playground` or a docs app as integration and system surfaces

## Default Rule

If a new project has a UI, do not start by inventing a fresh component system.

Start from the bundled UI baseline and only diverge when one of these is true:

- the product has a domain-specific component that does not belong in shared UI
- the project needs an app-local composition over shared primitives
- the visual language needs new tokens or wrappers but not new primitive behavior

## What to Reuse vs What to Own

Reuse from the bundled baseline:

- primitive controls
- base form fields
- common overlays and menus
- shared motion timing and transition patterns
- token structure
- Storybook conventions

Own locally in the project:

- page-level compositions
- brand-specific token values
- domain-specific compound components
- app-specific wrappers around shared primitives

## What Not to Do

- do not copy-paste shared components into app code as a default workflow after the repo has a `packages/ui` boundary
- do not fork primitives just to tweak spacing or visual tone
- do not let every UI repo invent its own Tailwind token naming
- do not treat shadcn output as the final design system

The structural baseline is bundled in this scaffold. The aesthetic layer remains project-specific.

## Baseline UI Stack

For a new UI repo, prefer:

- Next.js 16.2 App Router
- React 19.2
- Tailwind CSS 4.3
- Base UI primitives (`@base-ui/react`)
- `motion`
- `lucide-react`
- Storybook for reusable exported components

Base UI is the house default primitive layer. shadcn scaffolds Base UI-backed components by default as of July 2026 (`npx shadcn init`), and Base UI ships as one package — `@base-ui/react`. Radix is a supported opt-out via `npx shadcn init -b radix`; on Radix, use the unified `radix-ui` package, never the split per-component Radix packages.

## Reusable Howells UI Packages

Do not use an old shared UI upstream as the UI layer for new projects. Only use specific installable components when the interaction matches the package.

Use:

- `@howells/stacksheet` for typed stacked sheets, drill-in panels, and multi-layer modal flows
- `@howells/aperto` for styled thumbnail-to-expanded media transitions and media lightboxes

Do not use legacy provenance as a reason to skip a repo-local `packages/ui` boundary when the repo owns shared primitives. The reusable packages are relevant as specific installable components, not as a shared UI system.

## Overlay Standard

Use different primitives for different overlay jobs.

For a simple drawer or mobile bottom sheet:

- use the shared drawer component from the repo UI package
- that drawer can stay `vaul`-backed under the hood

For stacked sheets, panel drills, or multi-layer modal flows:

- prefer `@howells/stacksheet`
- do not try to stretch a plain `vaul` drawer into a stacked workflow

For thumbnail-to-expanded media interactions:

- prefer `@howells/aperto`
- keep custom gallery/product behavior local to the app around the package

This distinction already shows up in your ecosystem:

- `vaul` wrappers recur inside shared UI packages
- `@howells/stacksheet` is the stronger abstraction when the interface needs real stack orchestration
- `@howells/aperto` is the reusable media-transition component when the interface needs a polished image or video expansion pattern

## Storybook Rule

If the repo exports user-facing reusable UI, Storybook is required.

That does not mean every app needs a huge Storybook surface. It means shared UI should have a visible contract and a place for visual regression checks.

## Bundled Baseline In Flight

The bundled baseline is still a starting point, not a frozen design system:

- keep generic primitives in `packages/ui`
- keep local wrappers thin until repeated needs prove a stronger shared primitive
- update the scaffold baseline when the same improvement appears across multiple active repos

This keeps new projects aligned without depending on a separate live upstream.

## Migration Rule for Existing Projects

When moving an older UI repo toward the new standard:

1. adopt the bundled token structure and shared CSS entrypoint first
2. migrate obvious primitives second
3. migrate shared compositions only after the primitive contract is stable
4. keep page-level product code local

Do not attempt a one-shot visual rewrite just to claim alignment.
