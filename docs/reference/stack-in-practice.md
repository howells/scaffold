---
title: "Stack in Practice"
description: "The services, packages, and tools I actually reach for, measured from what runs across my repos rather than an aspirational list."
---

# Stack in Practice

This is the stack I actually use, measured rather than idealised: the services wired into my repos, the packages that recur across nearly all of them, and the skills I invoke most. Where [Stack Decisions](./stack-decisions.md) says what a new repo *should* pin, this page says what the existing ones *do*. It's a snapshot, and it drifts; treat it as "what I currently reach for," not a contract.

## Services

The house stack, by category. Counts are rough repo footprints across active work; the point is which choice is the default, not the exact number.

| Category | Default | Also in use |
|---|---|---|
| **Hosting** | Vercel | Docker for containerised services; Cloudflare Workers occasionally |
| **Database** | Neon (Postgres) + Drizzle ORM | Upstash Redis for caching/rate-limits; Turso once |
| **LLM access** | **OpenRouter** as the gateway, wrapped by the Vercel AI SDK (`ai`) | direct `@ai-sdk/*` keys (Anthropic, OpenAI, Gemini) as secondary/fallback providers |
| **Embeddings** | Voyage | — |
| **Search / scraping** | Exa + Firecrawl (usually paired) | Tavily, Bright Data, ScrapingBee |
| **Agent browsing** | Kernel | the `agent-browser` skill for local automation |
| **Media / voice** | fal.ai (image/video), `@howells/motif` in front of it | ElevenLabs for voice |
| **Object storage** | Cloudflare R2, via the S3-compatible SDK | Vercel Blob occasionally |
| **Auth** | WorkOS (org/B2B) and Clerk (lighter/consumer apps) | — |
| **LLM observability** | Langfuse | — |
| **Product analytics** | PostHog | Vercel Analytics on marketing sites |
| **Data warehouse** | Snowflake (where the data lives there) | — |

Two I'm standardising on rather than reporting. They're the deliberate defaults going forward, not yet everywhere:

- **Errors:** Sentry.
- **Transactional email:** Resend.

A note on LLM access: the model provider is OpenRouter, not the Vercel AI Gateway. That buys one credential and provider switching without new SDK wiring, and it routes fine through the AI SDK. Keep the model-string selection behind `@howells/ai` rather than hardcoding provider strings across routes.

## Models in use

Model choices live in one place: `@howells/ai` for language and embedding models, `@howells/motif` for fal.ai media. Code asks for a *tier* or a *task* rather than a hardcoded ID, so a better model rolls out everywhere at once. The names below are families, not pinned versions — the exact version turns over fast and lives in the registry.

**Language**, by tier:

- **Fast — Gemini Flash-Lite.** The default for high-volume, latency-sensitive work: the cheapest usable tokens, with a large context window.
- **Standard — Gemini Flash.** The everyday balance of quality, speed, and cost, where most general and chat work lands.
- **Powerful — Gemini Pro.** For when output quality outweighs cost.
- **Reasoning — Claude Opus.** The top tier for hard planning and tool-heavy agentic work, where Claude's reliability under complex instructions earns its price.
- **Agentic and coding — GLM and Kimi.** Cheaper, sharper alternatives that beat the general-purpose models on tool-use and long-thinking code.
- **Creative — Claude Sonnet.** The pick for prose and editorial voice.

**Embeddings.** Voyage for text and Voyage multimodal for a shared text-and-image space, both chosen for retrieval quality, with a Voyage reranker on top. Gemini embedding and OpenAI's small embedding model (cheap, low-dimension) as alternates, and a local Qwen embedder for offline work.

**Image generation** (fal.ai). nano-banana as the interactive default and gpt-image for agent and MCP calls, both picked for instruction-following and clean edits; FLUX schnell when speed and cost matter more than fidelity. A catalog behind them — FLUX, Seedream, Recraft, Ideogram, and the Gemini image models — covers different styles and price points.

**Vision and segmentation** (fal.ai). SAM for segmentation, BiRefNet and Bria for background removal, Depth-Anything and MiDaS for depth, Topaz / Clarity / SeedVR for upscaling, and Kling for image-to-video: the toolkit for turning a generated or uploaded image into a usable asset.

**Voice.** ElevenLabs as the default, Stable Audio for sound effects, and a self-hosted Chatterbox model for offline or cost-controlled synthesis.

## Packages

The dependency baseline is consistent: the same ~15 packages carry most repos. Authoritative pinned versions live in [Stack Decisions](./stack-decisions.md) and [Default Dependencies](./default-dependencies.md); this is just the measured shape.

- **Near-universal** (most repos): `typescript`, `react` / `react-dom`, `tailwindcss` (+ `@tailwindcss/postcss`), `next`, `zod`, `lucide-react`, `motion` (never `framer-motion`; fully migrated), plus the internal tooling scope `@howells/*` (`lint`, `typescript-config`, `envy`, `husky`), `vitest`, `turbo`, `lint-staged`.
- **Common UI**: `clsx` + `tailwind-merge`, `class-variance-authority`, `@base-ui/react` / `@radix-ui/*`, `@tanstack/react-query`, `nuqs`, `next-themes`, `sonner`, `cmdk`, and the `@patternmode/*` kit (`stacksheet`, `scrollframe`, `swatch`, `aperto`).
- **Data & AI**: `drizzle-orm` (+ `drizzle-kit`), `@neondatabase/serverless`, `ai` (Vercel AI SDK), `@howells/ai`, `@mastra/*` when orchestration is needed, `@modelcontextprotocol/sdk` for MCP.
- **Testing**: `vitest` for unit/integration, `@playwright/test` for E2E, `@testing-library/*`.

`tRPC` is deliberately rare; most repos favour server actions, the AI SDK, or plain typed fetch over a tRPC layer.

## Skills and tools

Measured from a month of actual invocations (both slash commands I type and skills invoked mid-task), not from repo mentions. Skills are installed globally and invoked on demand, never vendored into repos, so a repo grep badly undercounts them.

**The backbone: [Arc](https://github.com/howells/arc).** The delivery lifecycle runs through it: `/arc:ideate` → `implement` → `review` → `audit` → `refactor` → `commit`. By invocation volume it's the single most-used system, and `commit`, `review`, and `ideate` are the workhorses.

**Most-used specialists**, roughly in order of how often I reach for them:

- **chiaroscuro**: UI design direction and Tailwind v4 systems. My most-invoked individual skill by a wide margin; design direction is central to how I work, not a side concern.
- **/chrome** and **fieldtest**: browsing/dogfooding and evidence-backed rendered QA.
- **foreman**: foreman-mode delegation, where the main loop plans and reviews while subagents write the code.
- **grill-with-docs** / **domain-model**: Matt Pocock's grilling skills for pinning the ubiquitous language before building.
- **marginalia**: concise JSDoc on public APIs.
- **mastraudit**: auditing Mastra implementations against current guidance.
- **deep-research**: multi-source, fact-checked research reports.
- On-demand: **componentize**, **heathen**, **aperture**, **fenceline** (structure/boundaries); **nomen** (naming); **deslop** (prose); **surface** (agent-readability); **foundry** (brand systems).

**External skills I lean on:** Matt Pocock's AI Hero set (`domain-model`, `grill-with-docs`, `improve-codebase-architecture`, the writing skills), the superpowers marketplace, and Vercel Labs' `agent-browser`.
