# Stack in practice

This snapshot records services, packages, and skills used across active repos. [Stack decisions](./stack-decisions.md) defines the new-project standard.

## Services

Counts are approximate repo footprints; use them to identify defaults, not as adoption metrics.

| Category | Default | Also in use |
| --- | --- | --- |
| **Hosting** | Vercel | Docker for containerised services; Cloudflare Workers occasionally |
| **Database** | Neon (Postgres) + Drizzle ORM | Upstash Redis for caching/rate-limits; Turso once |
| **LLM access** | Provider access through `@howells/ai` | Choose Gateway, OpenRouter, or a direct `@ai-sdk/*` provider explicitly when the product needs a particular route |
| **Embeddings** | Voyage | — |
| **Search / scraping** | Exa + Firecrawl (usually paired) | Tavily, Bright Data, ScrapingBee |
| **Agent browsing** | Kernel | the `agent-browser` skill for local automation |
| **Media / voice** | fal.ai (image/video), `@howells/motif` in front of it | ElevenLabs for voice |
| **Object storage** | Cloudflare R2, via the S3-compatible SDK | Vercel Blob occasionally |
| **Auth** | WorkOS for serious product apps | Clerk in a smaller set of lighter or existing apps |
| **LLM observability** | Langfuse | — |
| **Product analytics** | PostHog | Vercel Analytics in a small number of existing sites |
| **Data warehouse** | Snowflake (where the data lives there) | — |

Two prospective defaults are not yet widespread:

- **Errors:** Sentry.
- **Transactional email:** Resend.

A note on LLM access: `@howells/ai` is the authority for provider and model selection. Its current package-level default route is Vercel AI Gateway, selected after an April 2026 benchmark, with OpenRouter and direct providers available behind the same boundary. That is an implementation default inside `@howells/ai`, not a portfolio-wide requirement or evidence that every consuming project explicitly chose Gateway. Revalidate it when models and routing systems materially change.

## Models and media

Do not duplicate exact model rosters here. Language and embedding choices live in `@howells/ai`; media-generation and transformation choices live in `howells/motif`. Product code asks those packages for a tier or task instead of scattering fast-decaying model IDs through routes, prompts, and documentation.

New AI work starts on AI SDK 7. Existing AI SDK 6 products migrate deliberately because the provider and tool APIs are a compatibility-significant change, not a fleet-wide cosmetic bump.

## Packages

The dependency baseline is consistent: the same ~15 packages carry most repos. Authoritative pinned versions live in [Stack Decisions](./stack-decisions.md) and [Default Dependencies](./default-dependencies.md); this is just the measured shape.

- **Tooling spine**: `typescript`, `@howells/lint`, `@howells/typescript-config`, `turbo`, `lint-staged`, `vitest`, `tsx`, `@howells/husky`, and `@howells/envy` where runtime configuration exists.
- **UI repos**: `react` / `react-dom`, `tailwindcss` (+ `@tailwindcss/postcss`), `next`, `zod`, `lucide-react`, and `motion` (not `framer-motion` in current first-party work).
- **Common UI**: `cn`, `class-variance-authority`, `@base-ui/react` / `@radix-ui/*`, `@tanstack/react-query`, `nuqs`, `next-themes`, `sonner`, `cmdk`, and the `@patternmode/*` kit (`stacksheet`, `scrollframe`, `swatch`, `aperto`).
- **Data & AI**: `drizzle-orm` (+ `drizzle-kit`), `@neondatabase/serverless`, `ai` (Vercel AI SDK), `@howells/ai`, `@mastra/*` when orchestration is needed, `@modelcontextprotocol/sdk` for MCP.
- **Testing**: `vitest` for unit/integration, `@playwright/test` for E2E, `@testing-library/*`.

`tRPC` is deliberately rare; most repos favour server actions, the AI SDK, or plain typed fetch over a tRPC layer.

## Skills and tools

Measured from a month of actual invocations (both slash commands I type and skills invoked mid-task), not from repo mentions. Skills are installed globally and invoked on demand, never vendored into repos, so a repo grep badly undercounts them.

Claude Code and Codex handle the development loop directly. Matt Pocock's skills provide general methods; the Howells collection remains specialist.

**Most-used specialists**, roughly in order of how often I reach for them:

- **chiaroscuro**: UI design direction and Tailwind v4 systems. My most-invoked individual skill by a wide margin; design direction is central to how I work, not a side concern.
- **/chrome** and **fieldtest**: browsing/dogfooding and evidence-backed rendered QA.
- **foreman**: foreman-mode delegation, where the main loop plans and reviews while subagents write the code.
- **grill-with-docs** / **domain-modeling**: Matt Pocock's skills for pinning the ubiquitous language before building.
- **marginalia**: concise JSDoc on public APIs.
- **mastraudit**: auditing Mastra implementations against current guidance.
- **research** / **firecrawl-deep-research**: primary-source repository research and broader web research.
- On-demand: **componentize**, **heathen**, **aperture**, **fenceline** (structure/boundaries); **nomen** (naming); **deslop** (prose); **surface** (agent-readability); **foundry** (brand systems).

**External skills I lean on:** Matt Pocock's engineering set (`domain-modeling`, `grill-with-docs`, `improve-codebase-architecture`, and the writing skills), the superpowers marketplace, and Vercel Labs' `agent-browser`. See [Development skills](./development-skills.md) for the current installed routing map.
