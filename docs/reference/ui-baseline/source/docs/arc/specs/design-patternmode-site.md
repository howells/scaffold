# PatternMode site redesign

## Direction

- **Tone:** Precise, organic-technical. App UI density.
- **Density:** Compact controls and short paths to content.
- **Typography:** Inter everywhere (Ivar Display for landing hero only)
- **Color strategy:** Green-tinted oklch neutrals (hue 145) with muted teal accent
- **Motion philosophy:** Restrained. translate-y hover lift, no bounce, no scale.

## Changes

### 1. Color System (shared-styles.css)

Shift neutrals from hue 264 to hue 145.

| Token | Before (hue 264) | After (hue 145) |
|-------|-------------------|------------------|
| background | oklch(0.985 0.003 264) | oklch(0.985 0.004 145) |
| foreground | oklch(0.141 0.02 264) | oklch(0.145 0.015 145) |
| card | oklch(1 0 0) | oklch(1 0 0) (unchanged) |
| card-foreground | oklch(0.141 0.02 264) | oklch(0.145 0.015 145) |
| primary | oklch(0.205 0.03 264) | oklch(0.19 0.02 145) |
| primary-foreground | oklch(0.985 0.003 264) | oklch(0.985 0.004 145) |
| secondary | oklch(0.96 0.005 264) | oklch(0.96 0.005 145) |
| muted | oklch(0.94 0.006 264) | oklch(0.94 0.006 145) |
| muted-foreground | oklch(0.556 0.016 264) | oklch(0.556 0.012 145) |
| accent | oklch(0.588 0.158 241) | oklch(0.55 0.14 175) |
| accent-foreground | oklch(0.985 0.003 264) | oklch(0.985 0.004 145) |
| border | oklch(0.915 0.006 264) | oklch(0.915 0.006 145) |
| border-subtle | oklch(0.94 0.004 264) | oklch(0.94 0.004 145) |
| border-strong | oklch(0.85 0.012 264) | oklch(0.85 0.01 145) |
| input | oklch(0.995 0.002 264) | oklch(0.995 0.002 145) |
| ring | oklch(0.588 0.158 241) | oklch(0.55 0.14 175) |
| surface-subtle | oklch(0.975 0.003 264) | oklch(0.975 0.003 145) |
| selection | oklch(0.588 0.158 241 / 0.18) | oklch(0.55 0.14 175 / 0.18) |

Dark mode: same hue shift (264 → 145) across all dark tokens.

### 2. Typography Scale

| Element | Before | After |
|---------|--------|-------|
| --text-body | 0.9375rem (15px) | 0.875rem (14px) |
| --text-body-lg | 1.0625rem (17px) | 0.9375rem (15px) |
| --text-title-sm | 1.375rem (22px) | 1.25rem (20px) |
| --text-title | 2.25rem (36px) | 1.75rem (28px) |
| --text-title-lg | 3rem (48px) | 2.25rem (36px) |
| --text-label | 0.75rem (12px) | 0.6875rem (11px) |

Tracking stays the same. Line heights tighten proportionally.

### 3. Spacing Adjustments

| Element | Before | After |
|---------|--------|-------|
| Button base height | h-9 (36px) | h-8 (32px) |
| Button lg height | h-10 (40px) | h-9 (36px) |
| Input base height | h-9 (36px) | h-8 (32px) |
| Card padding | px-6 py-5 | px-4 py-4 |
| Dialog padding | p-6 | p-5 |
| Section gap (docs) | gap-4 | gap-3 |

### 4. Radius

| Token | Before | After |
|-------|--------|-------|
| --radius-sm | 0.375rem (6px) | 0.25rem (4px) |
| --radius-md | 0.5rem (8px) | 0.375rem (6px) |
| --radius-lg | 0.75rem (12px) | 0.5rem (8px) |
| --radius-xl | 1rem (16px) | 0.75rem (12px) |

Use tighter radii to match Forge.

### 5. Docs Site Layout (apps/web)

| Element | Before | After |
|---------|--------|-------|
| Docs body font size | inherited (15px) | 14px |
| Content max width | Fumadocs default | 900px |
| Preview component height | 32rem | 24rem |
| Sidebar font size | default | 13px |
| Landing hero font | text-title-lg | clamp(1.75rem, 4vw, 2.5rem) Inter bold |
| Landing hero (Ivar) | Used for all headings? | Hero h1 ONLY |
| Component showcase cards | generous padding | tight 12px padding |
| Theme customizer | full-width below hero | compact aside or collapsed |

### 6. Storybook Preview Background

| Before | After |
|--------|-------|
| #fafafc (blue-tinted) | #fafdf9 (green-tinted) |
| dark: #1f1f23 | dark: #1a1e19 (green-dark) |

### 7. Button Shadow Adjustments

Align button shadows with Forge's approach (simpler, less dramatic):

| Token | Before | After |
|-------|--------|-------|
| buttons-inverted | 3-layer with inset highlight | 2-layer: ring + subtle drop |
| buttons-neutral | ring + drop | ring + subtle drop (lower opacity) |
| buttons-danger | inset + colored ring | ring + subtle colored drop |

Remove inset highlights to match Forge.

## Landing page

Keep the component showcase and change:
- Hero heading in Ivar Display (the ONLY serif usage)
- Tighter, denser component showcase grid
- Theme customizer collapsed by default or in a sidebar
- No generous hero padding — get to the content fast
- Present the page as a tool, not a marketing page

## Constraints

- [ ] No element uses > 15px body text
- [ ] No padding > 1.5rem on cards
- [ ] No border-radius > 12px on anything
- [ ] No backdrop-blur on non-overlay elements
- [ ] Accent color is muted teal, not vivid blue
- [ ] Shadows are ring-first compound, not single-layer
- [ ] Selection color uses teal, not blue
- [ ] Green tinting visible on backgrounds (not pure gray)

## Files to modify

1. `packages/tailwind-config/shared-styles.css` — full token overhaul (colors, radii, typography, shadows)
2. `packages/ui/src/components/button/button-variants.ts` — adjust sizes, shadow tokens
3. `packages/ui/src/components/input/input-variants.ts` — adjust heights
4. `packages/ui/src/components/card/card-root.tsx` — tighten padding
5. `apps/web/app/(home)/page.tsx` — landing page redesign
6. `apps/web/components/theme-customizer.tsx` — adjust customizer
7. `apps/web/app/global.css` — any docs-specific overrides
8. `apps/storybook/.storybook/preview.ts` — update background colors
9. Multiple component files — adjust padding/sizing consistently
