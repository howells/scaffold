---
title: "UI projects"
description: "Patternmode as the starting point for UI: theme, motion, pattern components, and where Storybook earns its place."
---

# UI projects

[Patternmode](https://patternmode.com) is the starting point for every new UI. It's a live, tested, published catalogue in `~/Sites/patternmode`, and it owns the house theme, motion tokens and pattern components. Scaffold documents when to use it; it doesn't carry a copy.

## Start a UI repo

1. Scaffold Base UI-backed components with `npx shadcn init`.
2. Install the theme: `npx shadcn add https://patternmode.com/r/theme.json`. It supplies light and dark colour tokens, self-hosted Inter Variable with its OpenType features, radii, shadows and the body base.
3. Register the `@patternmode` namespace in `components.json` (see [Config snippets](./config-snippets.md)).
4. Follow the [Patternmode style guide](https://github.com/howells/patternmode/blob/main/docs/style.md) for typography roles and recipes. Apply the recipes in app code, so installed components stay upgradeable.
5. Install `@howells/motion` for durations, easings, springs and presets rather than defining them locally.
6. Add a `@patternmode/*` package when the interaction matches one. Pin it once in the workspace catalogue.

## Pattern components

Use the package when the interface needs the pattern:

- `@patternmode/stacksheet` for typed stacked sheets, drill-in panels and multi-layer modal flows
- `@patternmode/aperto` for thumbnail-to-expanded media transitions and lightboxes
- `@patternmode/deck` for card decks with finite or cyclic advance
- `@patternmode/scrollframe` for scroll areas with measured fades and movement controls
- `@patternmode/swatch`, `halo`, `channel`, `briolette` and `parquet` for colour display and colour picking
- `@patternmode/thumbnail` for framed images
- `@patternmode/verge` for controls that reveal on hover, focus or touch
- `@patternmode/tags` for tags and tag inputs
- `@patternmode/status` for animated status marks
- `@patternmode/system` for sizing, composition and weighted-distribution utilities

Keep product-specific behaviour in the app around the package. A pattern that recurs across repos belongs in Patternmode, not in a second copy.

## Local ownership

Own these in the project:

- `packages/ui` for the repo's shadcn components and shared compositions, once more than one app needs them
- brand-specific token values layered over the Patternmode theme
- page-level compositions and domain-specific compound components
- thin wrappers around shared primitives

Avoid:

- copying Patternmode components into app code instead of installing them
- forking a primitive to change spacing or tone; change tokens or wrap it
- inventing a new token vocabulary; Patternmode components read the standard shadcn variables

## Baseline UI stack

- Next.js App Router
- React
- Tailwind CSS v4
- Base UI primitives (`@base-ui/react`)
- the Patternmode theme
- `motion` and `@howells/motion`
- `lucide-react`

Base UI is the house primitive layer. shadcn scaffolds Base UI-backed components by default, and Base UI ships as one package, `@base-ui/react`. Radix is a supported opt-out via `npx shadcn init -b radix`; on Radix, use the unified `radix-ui` package, never the split per-component Radix packages.

For task-by-task library choices, see [Library picks by task](./default-dependencies.md#library-picks-by-task).

## Overlays

Use different primitives for different overlay jobs:

- a simple drawer or mobile bottom sheet: the repo's `vaul`-backed drawer
- stacked sheets, panel drills or multi-layer modal flows: `@patternmode/stacksheet`; don't stretch a `vaul` drawer into a stack
- thumbnail-to-expanded media: `@patternmode/aperto`

## Storybook

Storybook is for complex projects only: a repo whose shared UI package is large enough that its components need reviewing in isolation. materia and openground have one; most repos don't need it. Patternmode's own catalogue site is its visual contract.

## Migrate an existing project

1. Install the Patternmode theme and replace local token definitions with overrides on top of it.
2. Replace local motion constants with `@howells/motion`.
3. Swap local copies of a Patternmode pattern for the package.
4. Keep page-level product code local.

Migrate in stages; alignment doesn't require a one-shot visual rewrite.
