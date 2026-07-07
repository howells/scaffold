import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "Browse the Howells Scaffold baseline for project shape, tooling, package boundaries, agent workflow, and launch readiness.",
  title: "Scaffold",
};

const startHere = [
  {
    desc: "Install the baseline, understand the repo shape, and see what should be decided up front.",
    href: "/docs/getting-started",
    title: "Getting Started",
  },
  {
    desc: "Choose the lightest project shape that fits the work without importing unnecessary machinery.",
    href: "/docs/reference/repo-archetypes",
    title: "Repo Archetypes",
  },
  {
    desc: "Use the current default versions and stack choices without re-litigating every new repo.",
    href: "/docs/reference/stack-decisions",
    title: "Stack Decisions",
  },
];

const projectShape = [
  {
    desc: "Architecture defaults for Next apps, packages, services, data, AI-capable products, and deployable surfaces.",
    href: "/docs/reference/architecture-defaults",
    title: "Architecture Defaults",
  },
  {
    desc: "Where package boundaries should exist, when to split code, and what belongs in shared packages.",
    href: "/docs/reference/package-boundaries",
    title: "Package Boundaries",
  },
  {
    desc: "Shared package candidates and the threshold for promoting reusable code out of one product repo.",
    href: "/docs/reference/shared-package-candidates",
    title: "Shared Package Candidates",
  },
  {
    desc: "UI project defaults, component boundaries, Storybook expectations, and shared design-system rules.",
    href: "/docs/reference/ui-projects",
    title: "UI Projects",
  },
];

const operations = [
  {
    desc: "Linting, formatting, TypeScript, environment, workspace, and deployment snippets for new repos.",
    href: "/docs/reference/config-snippets",
    title: "Config Snippets",
  },
  {
    desc: "Deployment defaults for Vercel, Cloudflare, database-backed products, and environment validation.",
    href: "/docs/reference/deployment-defaults",
    title: "Deployment Defaults",
  },
  {
    desc: "Default dependencies to reach for when a repo actually needs UI, data, AI, auth, or testing capability.",
    href: "/docs/reference/default-dependencies",
    title: "Default Dependencies",
  },
  {
    desc: "Pre-launch checks for quality, metadata, observability, performance, deployment, and handoff.",
    href: "/docs/reference/launch-checklist",
    title: "Launch Checklist",
  },
];

const agentWork = [
  {
    desc: "What root agent instructions should cover, how to keep them short, and where repo context belongs.",
    href: "/docs/reference/agent-workflow",
    title: "Agent Workflow",
  },
  {
    desc: "Guidance for repos that include agent runtimes, orchestration, MCP, tools, or AI-facing product work.",
    href: "/docs/reference/agentic-development",
    title: "Agentic Development",
  },
  {
    desc: "The decision record for packaging Scaffold as a skill without forking the canonical project docs.",
    href: "/docs/adr/0001-agent-skill-packaging",
    title: "Agent Skill Packaging",
  },
];

function LinkList({
  items,
}: {
  readonly items: readonly { desc: string; href: string; title: string }[];
}) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link
          className="group rounded-lg border border-fd-border p-4 transition-colors hover:border-fd-ring hover:bg-fd-accent"
          href={item.href}
          key={item.title}
        >
          <h3 className="text-sm font-medium text-fd-foreground group-hover:text-fd-accent-foreground">
            {item.title}
          </h3>
          <p className="mt-1 text-xs leading-5 text-fd-muted-foreground">
            {item.desc}
          </p>
        </Link>
      ))}
    </div>
  );
}

const HomePage = () => {
  return (
    <main className="flex flex-col items-center bg-fd-background text-fd-foreground">
      <section className="w-full max-w-5xl px-6 pb-14 pt-16 sm:px-10">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-fd-muted-foreground">
          Howells project baseline
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
          A field guide for starting projects with less drift.
        </h1>
        <p className="mt-6 max-w-2xl text-[0.9375rem] leading-7 text-fd-muted-foreground">
          Scaffold captures the shared defaults for project shape, tooling,
          package boundaries, agent workflow, deployment expectations, and
          launch readiness.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex h-10 items-center rounded-md bg-fd-primary px-5 text-sm font-medium text-fd-primary-foreground transition-colors hover:bg-fd-primary/90"
            href="/docs/overview"
          >
            Read the docs
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-md border border-fd-border px-5 text-sm font-medium text-fd-muted-foreground transition-colors hover:border-fd-ring hover:text-fd-foreground"
            href="/docs/getting-started"
          >
            Start a repo
          </Link>
        </div>
      </section>

      <section className="w-full border-t border-fd-border">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold text-fd-foreground">
              Start with the repo
            </h2>
            <span className="text-xs text-fd-muted-foreground">
              three routes through the baseline
            </span>
          </div>
          <LinkList items={startHere} />
        </div>
      </section>

      <section className="w-full border-t border-fd-border">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
          <h2 className="text-lg font-semibold text-fd-foreground">
            Project shape
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-fd-muted-foreground">
            These chapters define how a repo should be organized before
            implementation details start to sprawl.
          </p>
          <LinkList items={projectShape} />
        </div>
      </section>

      <section className="w-full border-t border-fd-border">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
          <h2 className="text-lg font-semibold text-fd-foreground">
            Operations
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-fd-muted-foreground">
            These chapters keep setup, dependency choice, deployment, and launch
            checks consistent across product work.
          </p>
          <LinkList items={operations} />
        </div>
      </section>

      <section className="w-full border-t border-fd-border">
        <div className="mx-auto max-w-5xl px-6 py-14 sm:px-10">
          <h2 className="text-lg font-semibold text-fd-foreground">
            Agent workflow
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-fd-muted-foreground">
            These chapters explain how Scaffold should guide coding agents
            without turning every consuming repo into a copy of Scaffold.
          </p>
          <LinkList items={agentWork} />
        </div>
      </section>
    </main>
  );
};

export default HomePage;
