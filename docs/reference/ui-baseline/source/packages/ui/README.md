# @patternmode/ui

Historical package shape for shared PatternMode React components.

## Principles

- Components live here, not in apps.
- Public entrypoints stay small and stable.
- Implementation lives behind barrel files when a component grows beyond a single file.
- Shared support code belongs in `src/lib` and `src/utils`, not scattered across components.
- Storybook reviews package-owned stories and app-local demos.

## Structure

```text
src/
  components/
    button.tsx
    button/
      button-root.tsx
      button-variants.ts
      button.stories.tsx
  lib/
    size.ts
    variant.ts
  utils/
    cn.ts
    focus-input.ts
    focus-ring.ts
  stories/
    design-tokens.stories.tsx
```

## Scope

Keep these structural traits:

- broad primitive coverage for shared UI foundations
- package-level stories for review and regression confidence
- utility and type layers that keep components consistent

Treat PatternMode as a structural reference, not an aesthetic template.
