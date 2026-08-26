# Design context

Archived PatternMode design decisions. They explain the recovered source but do not override current Scaffold guidance.

## Brand

- **Name**: PatternMode
- **Personality**: Precise, confident, organic-technical
- **Tone**: App UI first — dense, functional, readable. Landing page adapts to that tone, not the reverse.

## Typography

- **Display font**: Ivar Display (landing page hero only)
- **Body font**: Inter (everywhere, including docs headings)
- **Mono font**: Geist Mono

## Colour strategy

Use green-tinted greys from Forge rather than zinc or warm ivory.

### Light-mode neutrals (oklch, hue 145)

```
background:     oklch(0.985 0.004 145)   # very faint green-white
foreground:     oklch(0.145 0.015 145)   # dark green-black (like Forge #141e12)
card:           oklch(1 0 0)              # pure white
muted:          oklch(0.94 0.006 145)    # light green-gray
muted-fg:       oklch(0.556 0.012 145)   # mid green-gray
border:         oklch(0.915 0.006 145)   # subtle green-tinted border
```

### Accent

- **Primary action**: oklch(0.205 0.02 145) — near-black green (like Forge foreground)
- **Interactive accent**: oklch(0.55 0.14 175) — muted teal (from Forge/Stow)
- **Ring/focus**: Same teal

### Shadows

Every shadow is ring + micro-blur + drop:

```
card-rest:    0 0 0 1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.07), 0 2px 4px 0 rgb(0 0 0 / 0.04)
card-hover:   0 0 0 1px rgb(0 0 0 / 0.06), 0 2px 4px -1px rgb(0 0 0 / 0.08), 0 4px 12px 0 rgb(0 0 0 / 0.08)
flyout:       0 0 0 1px rgb(0 0 0 / 0.06), 0 4px 8px 0 rgb(0 0 0 / 0.06), 0 12px 24px -4px rgb(0 0 0 / 0.1)
modal:        0 0 0 1px rgb(0 0 0 / 0.06), 0 8px 16px 0 rgb(0 0 0 / 0.08), 0 24px 48px -8px rgb(0 0 0 / 0.14)
```

## Spacing

- **Base unit**: 4px
- **Body text**: 14px (0.875rem) — tight like Forge/Stacksheet, not inflated
- **Card padding**: 1rem (16px) default
- **Section spacing**: 2rem-3rem between major sections in docs
- **Docs content width**: 900px max (from Stacksheet)
- **Docs sidebar**: Tight, functional, no decorative padding

## Motion

- **Style**: Restrained and precise. No bounce, no exaggeration.
- **Library**: CSS transitions for most things; motion/react only when JS control required
- **Hover**: translate-y -1px + shadow elevation change. No scale.
- **Durations**: 150ms for hovers, 200ms for reveals, 250ms for dialogs

## References

- [Medusa UI](https://docs.medusajs.com/ui): flat buttons, clean tables, subtle borders, and more space.
- Linear: compact documentation and dense controls.
- PatternMode: Medusa's surface treatment at Linear's density, with muted avatars, 8px radii, and flat buttons.

## Project-specific constraints

- No generous whitespace for its own sake — whitespace must create hierarchy, not fill space
- No inflated text sizes (body > 15px is too large for this)
- No rounded-full on non-pill elements
- No backdrop-blur on cards (save for overlays only)
- No gradient dividers or decorative elements in docs pages
- No "hero section" energy in the docs — it's a reference, not a pitch
- The landing page can have personality; docs pages are strictly functional
- No saturated avatar colors — use muted gray-range palette
- No button gradients or pseudo-element overlays — flat surfaces only
- Default component radius is rounded-md (6px) via RADIUS_CLASSES; Card is rounded-lg (8px); never rounded-xl or larger for containers
