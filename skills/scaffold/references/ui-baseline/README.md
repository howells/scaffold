# Bundled UI baseline

This directory began with files recovered from `~/Sites/patternmode` at commit `1ffeb6ddb9d5d449a3618f3b73f79b93590cd463^`. Package manifests and primitive choices follow current Scaffold guidance, including Base UI (`@base-ui/react`).

Treat it as reference source, not an installable upstream. Copy only the required package shapes, then rename scopes and imports.

## Included source

- `source/packages/motion` for durations, easings, springs, scales, and motion presets.
- `source/packages/transition` for shared transition primitives and preset structure.
- `source/packages/tailwind-config` for Tailwind CSS 4.3 wiring. Its stylesheet still contains recovered product-specific Mtag, side-panel, and header tokens; do not copy it wholesale.
- `source/packages/ui/README.md` for the intended component package shape.
- `source/docs/design-context.md` as an archived explanation of the recovered token values. It is not current implementation guidance.
- `source/apps/web/content/docs` as historical PatternMode package documentation. Verify it against the package source before reuse.

## Use it

For a new UI repo:

1. Start with local workspace packages such as `packages/ui`, `packages/tailwind-config`, `packages/motion`, and `packages/transition` only when the repo needs them.
2. Copy only the relevant files from `source/packages/*`; remove product-specific tokens and utilities.
3. Rename `@patternmode/*` package names and imports to the repo's actual package scope or workspace aliases.
4. Keep shared primitives in `packages/ui`; keep page-specific or domain-specific compositions in the app.
5. Use Storybook when the repo exports reusable UI.

The `@patternmode/*` names are placeholders. Rename them in the consuming repo. Scaffold does not build this vendored source, so run the consuming repo's typecheck, tests, Storybook build, and app build before use.
