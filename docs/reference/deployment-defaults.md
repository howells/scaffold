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
- use `files-sdk` inside the storage/upload integration layer when the app needs a portable object/blob API across the selected storage provider

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

## Environment preflight

Use `@howells/envy` before deployments that depend on runtime configuration.

Default checks:

- validate local and CI env against the schema
- check Vercel env before Vercel deploys
- check Railway env before Railway deploys
- push only schema-declared variables
- avoid shell pipelines that can add newlines or leak secret values

The deploy should fail before it reaches the provider if required env is missing.

## Deployment rules

- deployment should match repo archetype
- expose a non-secret build identity and verify the live surface reports the expected revision after production deployment
- keep a low-cost scheduled freshness check for products where a missed deployment is operationally material
- do not deploy worker-heavy systems like they are simple marketing sites
- do not split runtimes before the system needs it
- keep local scripts and deployment docs explicit

## Defaults

- Next.js app or docs surface: Vercel
- Storybook surface: Vercel
- worker-heavy or service-heavy backend: Railway-style deployment
- media storage and delivery: house media storage platform plus the relevant `@howells/*` integration package, with `files-sdk` underneath when code needs provider-neutral object/blob operations
- runtime env preflight: Envy

Record any deviation.
