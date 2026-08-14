---
title: "Bundled UI Baseline"
description: "The bundled UI baseline that seeds new UI packages: shared components, design tokens, motion, and Storybook, vendored into the scaffold."
---

# Bundled UI Baseline

This directory is the scaffold's maintained UI baseline. It originated as UI-system files recovered from the old `~/Sites/patternmode` history at commit `1ffeb6ddb9d5d449a3618f3b73f79b93590cd463^`, but it is no longer a frozen snapshot. It tracks current scaffold guidance and is migrated as the baseline moves — the primitive layer is now Base UI (`@base-ui/react`), following the scaffold default, and lint scripts and shared dependencies are kept on current versions.

Treat this as scaffold-owned reference material, not as an external upstream dependency. When creating a new UI repo, copy and adapt the relevant package shapes into that repo, then rename package scopes and imports to the target project.

## What Is Included

- `source/packages/motion` for durations, easings, springs, scales, and motion presets.
- `source/packages/transition` for shared transition primitives and preset structure.
- `source/packages/tailwind-config` for the Tailwind CSS 4.3 shared stylesheet and token wiring.
- `source/packages/ui/README.md` for the intended component package shape.
- `source/docs/design-context.md` and the archived material under `source/docs/arc/` for the visual and architectural rationale behind the baseline.
- `source/apps/web/content/docs` for the old docs copy around installation, tokens, motion, and responsive behavior.

## How To Use It

For a new UI repo:

1. Start with local workspace packages such as `packages/ui`, `packages/tailwind-config`, `packages/motion`, and `packages/transition` only when the repo needs them.
2. Copy the relevant package files from `source/packages/*`.
3. Rename `@patternmode/*` package names and imports to the repo's actual package scope or workspace aliases.
4. Keep shared primitives in `packages/ui`; keep page-specific or domain-specific compositions in the app.
5. Use Storybook when the repo exports reusable UI.

The original `@patternmode/*` package names are kept as workspace-local identifiers to rename per repo, but the code and dependencies are maintained against current scaffold guidance rather than frozen for provenance. Because this is vendored reference material, it is not built by this repo — build it inside a bootstrapped repo before trusting it. The scaffold guidance should point at this bundled baseline, not at a live Patternmode package.
