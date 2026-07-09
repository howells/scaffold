/**
 * Single source of truth for the development principles.
 *
 * The homepage renders this directly, and `docs/principles.md` is generated
 * from it by `scripts/generate-principles.ts` (`pnpm generate:principles`).
 * `pnpm check` verifies the generated doc is in sync. Edit here, never the doc.
 *
 * `summary` is the one-line homepage view; `body` is the full prose (Markdown,
 * with inline code and links) rendered into the docs page.
 */

export const principlesMeta = {
  title: "Principles",
  description:
    "The principles I build software by, drawn from how I actually work rather than an aspirational list.",
} as const;

export const principlesIntro: readonly string[] = [
  "These are the principles I actually build by, teased out of how I work across my active projects rather than assembled as an aspirational wishlist. Some I hold to closely; at least one I break constantly, and I've said so where that's true.",
  "One thread runs through many of them: constraints are leverage. Strict types, closed sets of options, and boundaries a tool enforces keep humans consistent, and they also coerce coding agents into doing the right thing by default. That matters more every month. Where a principle has a tool behind it, I've linked it.",
];

export interface Principle {
  readonly title: string;
  readonly summary: string;
  readonly body: string;
}

export interface PrincipleGroup {
  readonly group: string;
  readonly principles: readonly Principle[];
}

export const principleGroups: readonly PrincipleGroup[] = [
  {
    group: "Correctness & failure",
    principles: [
      {
        title: "Make the wrong thing impossible to compile",
        summary:
          "Model types so a nonsensical state can't be expressed; strictness is leverage over agents too.",
        body: "Model your types so a nonsensical state can't be expressed: mutually exclusive options become discriminated unions, fields only valid together are grouped, and `any` gives way to `unknown` narrowed at the edges. Everything crossing a boundary (a request body, an env var, a third-party response) is parsed by a schema before the code trusts it.\n\nStrict typing is not only insurance for humans. It's the most reliable lever you have over a coding agent: a model will happily write plausible-but-wrong code against a loose type, but it can't fight a strict one. When the only thing that compiles is the correct call, the compiler does the enforcing for you. Tighten the model until it refuses everything except what you actually want. Type-aware linting carries the same idea past types, into patterns the compiler alone can't catch.",
      },
      {
        title: "Fail loud, never fall back silently",
        summary:
          "Throw with the real reason. A masked failure is worse than a crash.",
        body: "When something breaks, throw with the real reason. Swallowing an error and degrading into a plausible-looking fallback is worse than crashing: it turns a billing failure, an auth failure, or a data-loss bug into output that looks like success, and it destroys the one thing you need to fix it, the trace that points at the cause. A silent fallback rarely helps the end user either; it just moves the failure somewhere further from where it started. Missing configuration is an error, not a skip. No empty catch blocks, no default substitution to cover an absent value. When in doubt, let it break where it broke. The [`/fail-fast`](https://github.com/howells/skills/tree/main/fail-fast) skill exists to hunt these down.",
      },
    ],
  },
  {
    group: "Shape & structure",
    principles: [
      {
        title: "Design from the data model up",
        summary:
          "Get the schema right early and the UI almost falls out of it.",
        body: 'Start with the data. The shape of your domain (the tables, their relationships, the constraints) is the foundation everything else rests on, and getting it right early clarifies the rest. A good schema makes the UI almost fall out of it: the screens, the states, and the queries follow from how the data is actually shaped, and a whole class of "how do I represent this?" problems never arises because the model already answered them. Treat the Drizzle schema as the blueprint if you let it be one. Design it deliberately, up front, and grow the app upward from there rather than bolting a data model onto UI you\'ve already built.',
      },
      {
        title: "The lightest shape that fits",
        summary:
          "Add machinery only when a real second concern appears. (The one I break most.)",
        body: "Start from the smallest structure that fits the work and add machinery only when a real second concern appears. A single-purpose tool doesn't need a monorepo, a task runner, workspace boundaries, or a test harness it will never exercise; that apparatus up front leaves dead configuration that rots and misleads whoever reads it next. When a piece of machinery stops fitting, remove it rather than working around it, and let the repo grow into heavier structure when the work demands it, not in anticipation.\n\nI'll be honest: this is the one I break most. Left to instinct I reach for the full works, scaffolding every package and boundary on day one, and regret it a week later when half of it is unused ceremony. It's here as much to remind me as to state a rule. The lightest shape is almost always right, and I almost always have to talk myself into it.",
      },
      {
        title: "Don't over-optimise",
        summary:
          "Make it hurt before you make it fast; tend it in Postgres before reaching for Pinecone.",
        body: "Reach for the simplest thing that could work, and make it hurt before you make it fast. I feel the pull constantly to jump straight to the specialist tool: a vector database before you've tried Postgres, a cache before you've measured the query, an abstraction before you've felt the pain it's meant to solve. Resist it. Tend the problem in the boring, already-present tool first; most of the time it's enough, and you'll have learned what you actually need before spending complexity on it. Premature optimisation trades a harder-to-change system for a problem you didn't have yet.",
      },
      {
        title: "Boundaries are mechanical, not conventional",
        summary:
          "Encode dependency direction as a rule a tool enforces, not one people remember.",
        body: "Package and module boundaries are only real if a tool enforces them. Apps never import apps; packages never import apps; shared infrastructure is reached only across an explicit boundary, a workspace package or a versioned HTTP contract, never a sneaky deep import into someone else's database layer. Encode the dependency direction as a lint or task-runner rule so a violation fails the build, rather than trusting everyone to remember it. The shape is usually the same: a domain core that owns the logic, thin app clients that validate, persist, and dispatch, and orchestration (agent runtimes included) that coordinates without becoming the place behaviour lives.",
      },
      {
        title: "One source of truth; derive the rest",
        summary:
          "A fact lives in one place; generate the copies so they can't drift.",
        body: "A fact should live in exactly one place, and everything else should be generated from it rather than kept in sync by hand. An enum, a schema, a config value, an API's capability list, a version number: pick the canonical home and derive the rest with a build step or a script. Hand-maintained copies drift the moment the original moves; a derived copy cannot. Reach for codegen before copy-paste and discipline.\n\nThe same instinct scales up to architecture. When more than one thing needs the same data, that data gets its own home: a dedicated service behind a versioned API when the consumers are separate deployables, or a shared package when they live in the same workspace. Shared domain knowledge lives in one owned place that others consume across an explicit boundary, never copied into each consumer or reached for behind its back.",
      },
      {
        title: "Many small files, budgeted",
        summary:
          "One thing per file, with size and complexity as a budget the linter checks.",
        body: "Prefer many small files to a few large ones. A file that does one thing, ideally with one main export, is easier for both a person and an agent to hold in their head and change safely. Push this further than feels natural: one function per file, one component (and each meaningful sub-component) in its own file. That granularity keeps every unit independently readable, testable, and moveable, and it makes an agent's job easier, because a focused file is a focused context.\n\nTreat size and complexity as a budget the linter checks, not a matter of taste: a soft warning in the low hundreds of lines, a hard cap around 600–800 that forces a split, and complexity ceilings on individual functions. When a module crosses the line, that's the signal to decompose it, not to bump the limit.",
      },
      {
        title:
          "Promote repetition into one canonical component, then delete the copies",
        summary: "When a pattern hits three, extract it and delete the copies.",
        body: "When a pattern shows up a third time, extract it to the shared package and delete the local copies in the same move; a consolidation isn't done until the duplicates are gone. Keep shared components generic and composable. Page- or product-specific UI stays in the app and never leaks into the shared layer, which otherwise fills with special cases and stops being reusable. The point isn't reuse for its own sake. It's one place to fix a bug and one place to change a look.",
      },
      {
        title: "Offer a closed set of options and force the choice",
        summary:
          "A small, enforced menu of choices; coherence by construction, not review.",
        body: "Reduce the menu of decisions to a small, known-good set, and make the system enforce picking from it. Most freedom in a codebase is freedom to be subtly inconsistent, so take it away where it doesn't earn its keep. Typography becomes a handful of named roles, and raw `text-sm`/`font-medium` in markup is a lint error rather than a judgement call. Colour is a fixed set of semantic tokens, not arbitrary hex. Components live as a bounded library in one known folder that you compose from, rather than a scatter of one-offs invented per page. The same instinct runs through the whole stack: a closed set of options, selected rather than reinvented.\n\nThis is coherence by construction rather than by review. It's also leverage over agents: a model given ten roles to choose from picks one, but given free rein it invents an eleventh slightly-different grey every time. Constrain the choices and both people and models land in the same place by default.",
      },
    ],
  },
  {
    group: "Language & naming",
    principles: [
      {
        title: "Fix the ubiquitous language first",
        summary: "Pin the words before the code; one glossary, used exactly.",
        body: "Before building much, pin down the words. Every project keeps a short glossary of its domain terms, the preferred word for each concept and the synonyms to avoid, and code, UI, APIs, and agent instructions all use those exact terms. A shared, precise vocabulary lets people and agents talk about the system without quietly meaning different things, and it stops the slow rot where one concept ends up called three names across the schema, the routes, and the UI. Renaming a concept means updating the glossary, the schema, and the tests together, in one sweep.\n\nMatt Pocock's grilling skills are the sharpest tool I've found for this. An agent interrogates a feature against your codebase's language before any code is written, building the glossary and the decision record as it goes. He's been renaming them; the current forms are [`/domain-model` and `/grill-with-docs`](https://www.aihero.dev/skills).",
      },
      {
        title: "Name after meaning, not implementation",
        summary:
          "Name for the concept, not the mechanism, and treat renaming as real work.",
        body: "Name things for the concept they represent, not the mechanism behind them: a component is `Deck`, not `CardStack`; a term is `Source Record`, not `articles`. A good name passes a sayability test. If it's awkward to say out loud in a sentence about the system, it's probably wrong.\n\nNaming is genuinely hard, and there's no getting it perfect first time; you make your best guess and move on. The trick is not treating that guess as permanent. Naming is never finished: when a better word appears, renaming is real, tested migration work worth doing, propagated through data, API, and UI in one pass rather than left as a sticky note of regret.",
      },
    ],
  },
  {
    group: "Toolchain & operation",
    principles: [
      {
        title: "Decide the toolchain once, reuse everywhere",
        summary:
          "Shared pinned configs; understand one way deeply and roll changes out everywhere.",
        body: "Settle the toolchain (package manager, linter, formatter, TypeScript config, task runner) once at the baseline level, and have every repo consume those shared, pinned config packages instead of hand-rolling its own. A repo that adds a bespoke lint or format setup is buying itself drift for no gain. Pin versions so upgrades are deliberate; exact-pin the fast-moving frameworks that ship breaking changes without warning, and put a short cooldown on brand-new releases so a just-published package can't land automatically. When a repo genuinely must diverge, name that exception and give it a removal path rather than an open-ended escape hatch.\n\nThe deeper payoff is fluency. Doing things one way, everywhere, means you understand that one way deeply. You always have a reference point to return to and a pattern to repeat, instead of re-learning a slightly different setup in every repo. It also makes change cheap: when you find a better approach, a shared baseline lets you roll it out across every project at once, instead of hunting down twenty bespoke variations. This is why I keep the pinned configs as their own packages: [`@howells/lint`](https://github.com/howells/lint) for the Oxlint and Oxfmt presets, [`@howells/typescript-config`](https://github.com/howells/typescript-config) for the tsconfig presets.",
      },
      {
        title: "A small, consistent command surface at the root",
        summary:
          "The same short list of commands at every root; keep it uncluttered.",
        body: "Every repo is operable from the root through the same short list of commands: `dev`, `build`, `lint`, `typecheck`, `test`, and a single `check` that runs the whole gate. Consistent naming is the point, so anyone, and any agent, can walk up to any repo and drive it without learning bespoke incantations. Keep that surface small. A root `package.json` littered with dozens of scripts, half of them one-offs someone ran once, is noise that buries the handful of commands that matter; one-offs belong in a script file, not bolted onto the canonical set. The standard verbs stay stable and mean the same thing everywhere, and everything else stays out of the way.\n\nKeep the gate itself quick. Git hooks catch obvious breakage on commit and never try to be CI in miniature. If a hook gets slow enough that people start bypassing it, the hook is wrong.",
      },
      {
        title: "One typed env boundary",
        summary:
          "One typed boundary for env; a missing var fails loud at startup, not three layers deep.",
        body: "Environment variables go through a single typed boundary, one schema that parses and validates everything the app needs, instead of `process.env` reads scattered through the codebase. Importing that module shouldn't read the environment; you parse at a deliberate runtime boundary, so a missing or malformed variable fails loudly at startup rather than as a mysterious `undefined` three layers deep. Keep server-only and client-safe variables separated, and keep `.env` for secrets only, since deployment-mode configuration is a different kind of thing and doesn't belong next to your credentials. Nothing that is a secret should ever reach git or a log.\n\nMissing or wrong env vars cost more time than almost anything else, because the build inevitably errors somewhere far from the cause. Typecheck your environment and confirm it's wired up correctly before you rely on it; [`@howells/envy`](https://github.com/howells/envy) exists to catch a missing or malformed secret before a deploy, not after.",
      },
      {
        title: "Always work against the current docs",
        summary:
          "Models are confidently out of date; build against the latest docs, not memory.",
        body: "Models are confidently out of date. When you build against any library, model, or API, make sure you and your agents are looking at the latest documentation, not what a model half-remembers from training. Pull the current docs in explicitly; keep local clones when a source matters enough; don't assume a tool like Context7 has it right, because it often doesn't. Documentation is genuinely LLM-friendly now, dense and structured and easy to feed straight into context, so there's little excuse for working from a stale memory of an API that changed three versions ago. Verify the surface you're calling actually exists before you call it.",
      },
      {
        title: "When you do it three times, build the tool — and publish it",
        summary:
          "The third time you do it by hand, make it repeatable, and publish what helps others.",
        body: "The moment you catch yourself doing the same thing by hand for the third time, stop and make it repeatable: a script, a package, a skill, a shared component. When the result is good enough to help someone else, publish it. Most of my published work started this way, as a pattern extracted from repetition and given a home: the [`@howells/*`](https://github.com/howells) config and infra packages, the [Arc](https://github.com/howells/arc) workflow, the shared UI in [patternmode](https://patternmode.com). Extraction compounds. Every reusable piece you publish is one that you, and everyone downstream, stop rewriting.",
      },
    ],
  },
  {
    group: "Building forward",
    principles: [
      {
        title: "Steal good ideas",
        summary:
          "Nobody has this figured out; read the good repos and take what's better.",
        body: "Nobody has this fully figured out; the whole field is improvising in real time, and some people are improvising better than most, with their code right there to read. When you're deciding how to structure something, go look at how the good open-source repos did it (midday.ai was a favourite, RIP) and take what's genuinely better. This isn't cargo-culting, it's calibration. Reading how thoughtful teams solved the same problem is the fastest way to raise your own baseline, and adapting a proven pattern beats inventing an unproven one.",
      },
      {
        title: "Build for two audiences — and bet on the second",
        summary:
          "Build for people and agents alike, and bet the agentic surface wins soon.",
        body: "Everything you build now has two audiences: the people who use it and the agents that read, drive, and extend it. Today that split feels lopsided toward people, and it won't stay that way. Within a few months the agentic surface will be the one that matters most, so build for it now rather than retrofitting it later.\n\nIn practice that means interfaces an agent can actually use: CLIs and APIs that are self-describing (introspect the schema before acting), safe to rehearse (dry-run, then apply), and machine-readable by default (`--json`, structured errors with a code and a recovery hint, real exit codes). Every repo carries a short, operational `AGENTS.md`, covering how to work here, what not to touch, and the commands to rely on, written as terse rules rather than prose about the product, and treated as the canonical source other assistant configs point at. Record explicit non-goals so one tool doesn't quietly grow into another's runtime. Making software legible to agents is its own discipline now, and [agentsurface.dev](https://agentsurface.dev) is where I keep that thinking.",
      },
    ],
  },
];
