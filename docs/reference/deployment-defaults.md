---
title: "Deployment defaults"
description: "Vercel targets, environment checks, preview and production rules, and release gates."
---

# Deployment defaults

Choose the deployment shape with the repo architecture.

## Default web deployment

For Next.js apps, docs sites, and Storybook-like web surfaces:

- default to Vercel

Use Vercel for:

- product web apps
- docs sites
- Storybook deployments
- preview and production web releases

### Current Vercel platform defaults

- For new work, prefer `vercel.ts` via `@vercel/config` when the project needs checked-in configuration; typed config catches mistakes at author time. This is a prospective default, not yet the measured portfolio norm, which remains `vercel.json`.
- Fluid Compute is the default runtime. Do not reach for Edge Functions; they are no longer the recommended default.
- The default function timeout is 300s. Set `maxDuration` per function in `vercel.ts` only when a route needs a shorter or longer bound.

## Default docs deployment

If the repo has a real docs site:

- use Fumadocs on Next.js
- deploy on Vercel by default

## When Vercel is not enough

If the system becomes worker-heavy, cron-heavy, or multi-service:

- shift the service-heavy parts toward Railway-style deployment

This is the shape that shows up in service-heavy media systems:

- app and docs can still have web-oriented surfaces
- workers and services become their own deployable units

Use this when:

- background processing is central to the product
- there are multiple long-running or scheduled services
- deployment units need to be split by runtime responsibility

## API placement

Default order of preference:

1. keep app-internal behavior close to the main app through server composition or a focused typed service
2. create a separate API surface only when the system actually needs it
3. split into separate deployable services when runtime constraints justify it

Do not create a separate API app by reflex.

## Media delivery

If the repo has serious image, vector, or media behavior:

- default to the house media storage platform for storage and delivery

The runtime and deployment boundary must agree.

Use `@howells/stow-server` when the app needs a reusable typed media storage integration layer.

Install only the native client or peer dependencies for the selected Files SDK adapter, and keep provider credentials behind the repo's typed env boundary.

## Preview environments

The recurring web pattern is:

- preview deployments for active development
- production deployment from the stable branch

Keep this simple:

- one obvious preview path
- one obvious production path
- no hidden deployment routes

## CI and release runners

Use the runner that matches the work:

- GitHub-hosted `ubuntu-latest` for deployments, releases, repository housekeeping, drift checks, and scheduled maintenance
- Blacksmith only for measured CI validation where the smaller GitHub-hosted runner is materially slower or cannot complete reliably
- the smallest Blacksmith runner that passes the workload; increase the runner only from observed duration or memory evidence

Do not use Blacksmith for Vercel deployment waiting, release orchestration, cron-like data repair, branch management, or report generation. Cancel stale pull-request CI when a newer commit supersedes it, and skip full CI for draft pull requests.

Do not build the same web application in CI and Vercel unless the CI build proves a distinct contract that Vercel does not. The production Vercel build is the release build.

## Environment preflight

Use `@howells/envy` before deployments that depend on runtime configuration.

Default checks:

- validate local and CI env against the schema
- check Vercel env before Vercel deploys
- check Railway env before Railway deploys
- push only schema-declared variables
- avoid shell pipelines that can add newlines or leak secret values

The deploy should fail before it reaches the provider if required env is missing.

## Recoverable manual releases

Capture the actual builder's source after declared generation and stamping, before the build consumes it. Include required ignored or generated inputs explicitly. Keep credentials outside the archive; declare secret environment names through the project's typed environment boundary. Missing, unsafe or unresolved required inputs stop capture.

The source archive preserves file contents, modes, symlinks, base revision, tracked changes, required untracked inputs, dependency locks, toolchain and non-secret configuration. Capture verifies a restore round trip and emits a trusted archive SHA-256 and source-tree SHA-256. Keep the archive and its capture receipt together in existing private release storage or owning-issue attachments.

The prebuilt verifier checks that the source still matches the trusted archive, repeats restoration and verifies the existing platform requirements. It creates a private release receipt linking the source hashes to a digest of the local prebuilt output. A receipt cannot overwrite existing evidence. For separately owned adoption, use the existing operational commands with the capture receipt's trusted digest:

```sh
node scripts/check-vercel-prebuilt.mjs \
  --source-archive ARCHIVE --source-sha256 TRUSTED_ARCHIVE_SHA256 \
  --receipt NEW_RELEASE_RECEIPT

node scripts/publish-vercel-prebuilt.mjs \
  --source-archive ARCHIVE --source-sha256 TRUSTED_ARCHIVE_SHA256 \
  --receipt NEW_RELEASE_RECEIPT
```

The publisher requires the captured base revision in `VERCEL_GIT_COMMIT_SHA` or `GITHUB_SHA`. It rechecks the source, receipt, platform and output before any provider command. Upload uses the existing domain-free production deployment path. Initial and final inspection must agree on the exact deployment ID and immutable URL. The runtime revision and project acceptance probes remain required. Source or output drift, incomplete identity or a failed probe prevents promotion. The receipt records successful promotion only after the provider accepts it; rejection records failure and retains the evidence.

The digest describes the local prebuilt output submitted to the publisher. It does not establish byte-for-byte identity after provider packaging. Source restoration does not establish a deterministic rebuild. Both limits are explicit in the release receipt.

Scaffold's `pnpm deploy:prod` runs pull, source generation, stamping, capture, build, verification and publication in that order. `--no-publish` stops after verification. Every run creates a new private evidence directory; `--evidence-dir PATH` selects its parent. The Linux wrapper uses the same command and retains evidence outside its disposable checkout. Preserve the source archive, capture receipt and final release receipt in the existing private evidence location before retiring a builder.

Adoption in an owner-held application requires its own source scope and existing release authority. Tooling and passing fixture tests do not resolve historical source gaps or clear a release hold.

## Deployment rules

- deployment should match repo archetype
- production deploys once from the stable branch through one checked-in command or workflow
- automatic branch previews stay off by default; create previews deliberately for active review
- deployment and release orchestration use GitHub-hosted runners, not Blacksmith
- expose a non-secret build identity and verify the live surface reports the expected revision after production deployment
- keep a low-cost scheduled freshness check for products where a missed deployment is operationally material
- do not deploy worker-heavy systems like they are simple marketing sites
- do not split runtimes before the system needs it
- keep local scripts and deployment docs explicit

## Defaults

- Next.js app or docs surface: Vercel
- Storybook surface: Vercel
- worker-heavy or service-heavy backend: Railway-style deployment
- media storage and delivery: house media storage platform plus the relevant `@howells/*` integration package
- runtime env preflight: Envy

Record any deviation.
