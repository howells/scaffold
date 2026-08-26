# PatternMode UI library implementation plan

## Scope

Build the first usable `patternmode` release.

This implementation slice covers:

- a defined token contract in `@patternmode/tailwind-config`
- a consistent primitive set in `@patternmode/ui`
- Storybook stories that act as the visual contract for the new primitives
- a playground that demonstrates the packages together

App-specific compositions and migration tooling are out of scope. This slice establishes package APIs and review surfaces.

## Files

- `packages/tailwind-config/shared-styles.css`
  Own the house-style tokens, semantic colors, motion defaults, and shared utility-layer ergonomics.
- `packages/ui/src/lib/cn.ts`
  Keep shared class merging utility stable for the component layer.
- `packages/ui/src/components/button.tsx`
  Refine the primary interactive primitive and tighten its house-style defaults.
- `packages/ui/src/components/badge.tsx`
  Add a compact semantic accent primitive for status and metadata.
- `packages/ui/src/components/input.tsx`
  Add a consistent text input primitive with shared focus, density, and placeholder rules.
- `packages/ui/src/components/textarea.tsx`
  Extend the same field language to multiline entry.
- `packages/ui/src/components/card.tsx`
  Add a neutral surface primitive for sectioning, panels, and documentation layouts.
- `packages/ui/package.json`
  Ensure new component entrypoints are exported cleanly from the package boundary.
- `apps/storybook/src/stories/button.stories.tsx`
  Expand button coverage to prove the refined API and visual states.
- `apps/storybook/src/stories/badge.stories.tsx`
  Add badge review coverage.
- `apps/storybook/src/stories/input.stories.tsx`
  Add input and textarea review coverage.
- `apps/storybook/src/stories/card.stories.tsx`
  Add surface/panel review coverage.
- `apps/storybook/src/stories/introduction.stories.tsx`
  Reframe the intro story around the canonical upstream direction and the new primitives.
- `apps/playground/src/app/page.tsx`
  Replace the placeholder landing page with a polished system showcase.
- `README.md`
  Update the repo summary to match the new upstream surface.

## Task Graph

```xml
<task id="1" depends="" type="auto">
  <name>Expand the house-style token foundation</name>
  <files>
    <modify>packages/tailwind-config/shared-styles.css</modify>
  </files>
  <read_first>
    packages/tailwind-config/shared-styles.css
    apps/playground/src/app/globals.css
    apps/storybook/src/storybook.css
  </read_first>
  <action>
    Define semantic tokens for surfaces, muted treatments, accents, selection, and focus.
    Keep the existing neutral direction.
    Preserve Tailwind v4 conventions already used in the repo.
    Add only utilities and tokens that the first primitive set will actually consume.
  </action>
  <test_code>
    No standalone test file for CSS tokens in this task.
    Verification relies on package and app type/build commands in later steps.
  </test_code>
  <verify>
    pnpm build — succeeds for playground and storybook with the updated shared stylesheet
  </verify>
  <done>The shared stylesheet exposes the token contract without breaking existing consumers</done>
  <commit>feat(theme): expand canonical house-style tokens</commit>
</task>

<task id="2" depends="1" type="auto">
  <name>Add the first broader primitive set</name>
  <files>
    <modify>packages/ui/src/components/button.tsx</modify>
    <create>packages/ui/src/components/badge.tsx</create>
    <create>packages/ui/src/components/input.tsx</create>
    <create>packages/ui/src/components/textarea.tsx</create>
    <create>packages/ui/src/components/card.tsx</create>
    <modify>packages/ui/package.json</modify>
  </files>
  <read_first>
    packages/ui/src/components/button.tsx
    packages/ui/src/lib/cn.ts
    packages/ui/package.json
    packages/tailwind-config/shared-styles.css
  </read_first>
  <action>
    Keep APIs narrow and aligned with the design spec.
    Keep Button variant-driven with a narrow API.
    Add badge, input, textarea, and card primitives with controlled radii, measured contrast, and subtle motion.
    Use semantic variants only where they are clearly reusable.
    Avoid adding compositions or domain-specific wrappers.
  </action>
  <test_code>
    No standalone unit tests exist in this repo yet.
    Verify this task through TypeScript and downstream consumer builds after wiring the stories and showcase page.
  </test_code>
  <verify>
    pnpm typecheck — succeeds
    pnpm build — succeeds
  </verify>
  <done>The UI package exports a cohesive first primitive set with stable typed entrypoints</done>
  <commit>feat(ui): add canonical primitive set</commit>
</task>

<task id="3" depends="2" type="auto">
  <name>Turn Storybook into the visual contract for the new primitives</name>
  <files>
    <modify>apps/storybook/src/stories/button.stories.tsx</modify>
    <create>apps/storybook/src/stories/badge.stories.tsx</create>
    <create>apps/storybook/src/stories/input.stories.tsx</create>
    <create>apps/storybook/src/stories/card.stories.tsx</create>
    <modify>apps/storybook/src/stories/introduction.stories.tsx</modify>
  </files>
  <read_first>
    apps/storybook/src/stories/button.stories.tsx
    apps/storybook/src/stories/introduction.stories.tsx
    apps/storybook/.storybook/preview.ts
    packages/ui/src/components/button.tsx
  </read_first>
  <action>
    Add meaningful stories for every exported user-facing primitive built in task 2.
    Cover baseline usage, important visual variants, and the default theme.
    Use compositional review stories as well as prop tables.
  </action>
  <test_code>
    No automated story tests in this slice.
    The stories themselves are the review surface, validated by Storybook build output.
  </test_code>
  <verify>
    pnpm --filter @patternmode/storybook build — succeeds
  </verify>
  <done>Storybook provides meaningful review coverage for the canonical primitive set</done>
  <commit>feat(storybook): add review stories for canonical primitives</commit>
</task>

<task id="4" depends="2" type="auto">
  <name>Rebuild the playground as a polished system showcase</name>
  <files>
    <modify>apps/playground/src/app/page.tsx</modify>
    <modify>README.md</modify>
  </files>
  <read_first>
    apps/playground/src/app/page.tsx
    README.md
    packages/ui/src/components/button.tsx
    packages/ui/src/components/badge.tsx
    packages/ui/src/components/input.tsx
    packages/ui/src/components/textarea.tsx
    packages/ui/src/components/card.tsx
  </read_first>
  <action>
    Replace the placeholder hero with a showcase that uses the new primitives together.
    Show the house style, component scope, and downstream usage model.
    Update the README to match the implementation.
  </action>
  <test_code>
    No standalone UI test file for this task.
    Verification relies on the app build succeeding with the updated page.
  </test_code>
  <verify>
    pnpm --filter @patternmode/playground build — succeeds
  </verify>
  <done>The playground demonstrates the UI system and the README matches the repo</done>
  <commit>feat(playground): showcase the canonical ui system</commit>
</task>

<task id="5" depends="1,2,3,4" type="auto">
  <name>Run final verification for the first upstream slice</name>
  <files>
    <modify>none</modify>
  </files>
  <read_first>
    package.json
    apps/storybook/package.json
    apps/playground/package.json
  </read_first>
  <action>
    Run the repo-level verification commands that prove the new slice is stable.
    Report any warnings that remain, especially Storybook chunk-size noise, but do not widen scope unless the warning reflects a functional issue.
  </action>
  <test_code>
    No test code. This task is verification only.
  </test_code>
  <verify>
    pnpm typecheck — succeeds
    pnpm build — succeeds
  </verify>
  <done>Repo-level verification passes for the canonical UI library slice</done>
  <commit>chore(verify): validate first canonical ui slice</commit>
</task>
```
