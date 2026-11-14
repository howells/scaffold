---
title: "Model choice is repo-local"
description: "Why the model for each job lives in a repo's own models.ts rather than a shared package."
---

# Model choice is repo-local

Every AI-capable repo used to read the model for each job from `@howells/ai`. This ADR records why the baseline now keeps that table in the repo instead.

## Considered options

- **Keep the shared lookup.** One release changes a pick everywhere, and no repo writes a model string.
- **Narrow it to a jobs-only package.** Drop everything except the table of jobs and their settings.
- **Keep the table in each repo.** Duplicate a handful of IDs and let each repo change its own picks.

## Decision

Keep the table in each repo, in one `models.ts`, with the shape in [Architecture Defaults](../reference/architecture-defaults.md).

The shared lookup stopped paying for itself in two ways:

- **It stopped being a roster.** By 1.1.0 every language job resolved to the same model. A repo copying that table is copying one ID and the settings measured with it, not a matrix worth maintaining centrally.
- **It changed picks underneath repos that had already decided.** A lookup release moved `triage` to Gemini and `extract` to DeepSeek, which broke the provider pins repos had derived from the previous picks. Central change was a liability for the repos with the most measured evidence, and those were the repos most likely to overrule a shared default anyway.

A repo-local table also lets a repo record its own evidence next to its own pick, which is where that evidence belongs.

## Consequence

- Repos migrate as they are next touched; no fleet-wide migration is required to adopt the baseline.
- `@howells/ai` is deprecated. Its 0.x client, not the lookup, is what the remaining consumers still use, so those repos are separate modernisation work.
- A pick is duplicated per repo. Changing the house default means editing each repo that chose it, which is the deliberate cost.
- Formguide holds the comparisons behind a pick, and the module's JSDoc records the date and the reason a pick won.
