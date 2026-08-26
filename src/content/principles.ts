export const principlesMeta = {
  title: "Principles",
  description:
    "Howells development principles: strict types, enforced boundaries, and one source of truth.",
} as const;

export const principlesIntro: readonly string[] = [
  "These rules come from active projects. They describe current practice, including the rules I still break.",
  "Constraints help people and agents make consistent choices. Prefer types, closed options, and boundaries that tools can enforce.",
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
        summary: "Model types so invalid states cannot compile.",
        body: "Use discriminated unions for exclusive options, group fields that must occur together, and narrow `unknown` at system boundaries. Parse request bodies, environment variables, and third-party responses before use.\n\nStrict types also constrain coding agents. If only the correct call compiles, the compiler catches plausible but invalid code before review. Type-aware linting extends that protection beyond the type system.",
      },
      {
        title: "Fail loud, never fall back silently",
        summary:
          "Throw with the cause. Do not disguise a failure as plausible output.",
        body: "Throw with the cause. Do not turn billing, authentication, configuration, or data failures into plausible output. Empty catches and silent defaults hide the trace needed to fix the problem. Fail where the error occurs. Use [`/fail-fast`](https://github.com/howells/skills/tree/main/fail-fast) to find masked failures.",
      },
    ],
  },
  {
    group: "Shape & structure",
    principles: [
      {
        title: "Design from the data model up",
        summary: "Let domain entities and constraints shape the product.",
        body: "Start with domain entities, relationships, and constraints. Screens, states, and queries should follow the model. For Drizzle projects, treat the schema as the blueprint and design it before the UI hardens around accidental data shapes.",
      },
      {
        title: "The lightest shape that fits",
        summary:
          "Add machinery when a second concern requires it. This is the rule I break most.",
        body: "Start with the smallest structure that fits. A single-purpose tool may not need a monorepo, task runner, workspace boundaries, or a test harness. Add each when the work requires it, and remove machinery that no longer pays for itself.\n\nI tend to scaffold the full system too early. This rule exists to check that instinct.",
      },
      {
        title: "Don't over-optimise",
        summary: "Measure the problem before adding a specialist tool.",
        body: "Try the simplest tool already present. Measure a query before adding a cache; test Postgres before adding a vector database; feel repeated pain before extracting an abstraction. Optimising early spends complexity before the requirement is known.",
      },
      {
        title: "Boundaries are mechanical, not conventional",
        summary: "Make tools enforce dependency direction.",
        body: "Enforce dependency direction with lint or build rules. Apps do not import apps; packages do not import apps; shared infrastructure is reached through a workspace package or versioned API. Keep domain logic in the domain layer, app clients thin, and orchestration focused on coordination.",
      },
      {
        title: "One source of truth; derive the rest",
        summary: "Give each fact one canonical home and generate its copies.",
        body: "Give each enum, schema, config value, capability list, and version one canonical home. Generate copies with a script or build step.\n\nShared data belongs in a versioned service for separate deployables or an owned package within one workspace. Consumers cross that boundary instead of copying the data or reaching into another component's internals.",
      },
      {
        title: "Many small files, budgeted",
        summary: "Keep files focused and enforce size and complexity budgets.",
        body: "Keep files focused, usually with one main export. Separate meaningful subcomponents when doing so improves independent reading, testing, or movement.\n\nEnforce size and complexity budgets with lint rules: warn in the low hundreds of lines and set a hard cap around 600-800. Split a module that exceeds the budget; do not raise the limit by default.",
      },
      {
        title:
          "Promote repetition into one canonical component, then delete the copies",
        summary: "Extract a pattern when it appears three times.",
        body: "When a pattern appears three times, move it to the shared package and delete the copies. Keep product-specific UI in the app. A useful shared component provides one place to fix behaviour or appearance without collecting product exceptions.",
      },
      {
        title: "Offer a closed set of options and force the choice",
        summary: "Provide a small set of choices and enforce it.",
        body: "Offer named typography roles, semantic colour tokens, and approved components. Enforce the set where possible. Closed options reduce inconsistent one-offs and give people and agents the same choices.",
      },
    ],
  },
  {
    group: "Language & naming",
    principles: [
      {
        title: "Fix the ubiquitous language first",
        summary: "Define the terms before the code.",
        body: "Keep a short glossary of preferred domain terms and rejected synonyms. Use those terms in code, UI, APIs, and agent instructions. A rename updates the glossary, schema, and tests in one change.\n\nUse [`/domain-model` and `/grill-with-docs`](https://www.aihero.dev/skills) to test the language before implementation.",
      },
      {
        title: "Name after meaning, not implementation",
        summary: "Name the concept and treat renaming as migration work.",
        body: "Name the concept, not its implementation: `Deck`, not `CardStack`; `Source Record`, not `articles`. If a name is awkward in a sentence about the system, reconsider it.\n\nNames can change. Treat a rename as tested migration work across data, API, and UI.",
      },
    ],
  },
  {
    group: "Toolchain & operation",
    principles: [
      {
        title: "Decide the toolchain once, reuse everywhere",
        summary: "Share pinned config and record exceptions.",
        body: "Settle the package manager, linter, formatter, TypeScript config, and task runner in shared pinned packages. Exact-pin fast-moving frameworks and apply a short release cooldown. Record exceptions with a removal path.\n\nA shared toolchain reduces relearning and makes fleet-wide changes cheap. The current packages are [`@howells/lint`](https://github.com/howells/lint) and [`@howells/typescript-config`](https://github.com/howells/typescript-config).",
      },
      {
        title: "A small, consistent command surface at the root",
        summary: "Use the same small set of root commands in every repo.",
        body: "Expose `dev`, `build`, `lint`, `typecheck`, `test`, and `check` at the root. Put one-off operations in script files instead of crowding `package.json`. Keep Git hooks quick enough that nobody needs to bypass them.",
      },
      {
        title: "One typed env boundary",
        summary: "Parse and validate environment variables once.",
        body: "Parse environment variables through one typed schema at a deliberate runtime boundary. Separate server secrets from client-safe values and keep deployment mode out of `.env`. Never write secrets to Git or logs.\n\nUse [`@howells/envy`](https://github.com/howells/envy) to catch missing or malformed values before deployment.",
      },
      {
        title: "Always work against the current docs",
        summary: "Verify current APIs instead of trusting model memory.",
        body: "Check current primary documentation before using a library, model, or API. Keep a local clone when the source matters often. Treat aggregators and model memory as leads, then verify the exact surface you call.",
      },
      {
        title: "When you do it three times, build the tool",
        summary: "Turn the third manual repetition into a reusable tool.",
        body: "On the third manual repetition, make the work repeatable with a script, package, skill, or component. Publish it when others can reuse it. Examples include [`@howells/*`](https://github.com/howells), [`howells/skills`](https://github.com/howells/skills), and [patternmode](https://patternmode.com).",
      },
    ],
  },
  {
    group: "Building forward",
    principles: [
      {
        title: "Steal good ideas",
        summary: "Read strong implementations before inventing another.",
        body: "Read strong open-source implementations before designing a new structure. Copy a proven mechanism only after understanding the constraint it solves. Adaptation beats invention when the constraints match.",
      },
      {
        title: "Build for people and agents",
        summary:
          "Give people and agents clear interfaces and operational instructions.",
        body: "Design CLIs and APIs that people and agents can inspect and rehearse. Provide schema introspection, dry-run modes, JSON output, structured errors, recovery hints, and meaningful exit codes.\n\nEach repo keeps one short `AGENTS.md` with commands, constraints, and non-goals. Other assistant configs point to it. More guidance lives at [agentsurface.dev](https://agentsurface.dev).",
      },
    ],
  },
];
