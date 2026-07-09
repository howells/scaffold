import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Miniature,
  type MiniatureVariant,
} from "@/components/homepage/miniatures";

export const metadata: Metadata = {
  description:
    "How I start projects: the principles, defaults, and docs that keep repos from drifting.",
  title: "Scaffold",
};

const GITHUB_URL = "https://github.com/howells/scaffold";

const focusRing =
  "rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--sc-accent)]";

const principles = [
  {
    desc: "Settle toolchain basics at the baseline instead of re-deciding them in every repo.",
    title: "Decide once, reuse everywhere",
  },
  {
    desc: "Start from the smallest archetype that fits; add machinery only when a repo earns it.",
    title: "The lightest shape that fits",
  },
  {
    desc: "Prefer the plain, correct implementation to the clever one.",
    title: "Correctness over cleverness",
  },
  {
    desc: "The Project Docs are canonical; every assistant gets a generated wrapper, not a fork.",
    title: "Docs are the source of truth",
  },
  {
    desc: "A repo may diverge from the baseline when justified — and writes down why.",
    title: "Deviations are recorded, not smuggled",
  },
  {
    desc: "A short AGENTS.md that changes behavior without becoming documentation sludge.",
    title: "Agents are assets, not entropy",
  },
  {
    desc: "If hooks get slow enough that developers bypass them, the hooks are wrong.",
    title: "Hooks stop breakage, not run CI",
  },
  {
    desc: "Docs describe the current system, not the migration path taken to reach it.",
    title: "Docs describe the present",
  },
];

interface DocLink {
  readonly href: string;
  readonly title: string;
}

interface DocGroup {
  readonly desc: string;
  readonly key: string;
  readonly links: readonly DocLink[];
  readonly title: string;
  readonly variant: MiniatureVariant;
}

const docGroups: readonly DocGroup[] = [
  {
    desc: "Install the baseline, pick a repo shape, and settle the versions up front.",
    key: "start",
    links: [
      { href: "/docs/getting-started", title: "Getting Started" },
      { href: "/docs/reference/repo-archetypes", title: "Repo Archetypes" },
      { href: "/docs/reference/stack-decisions", title: "Stack Decisions" },
    ],
    title: "Start here",
    variant: "start",
  },
  {
    desc: "How a repo is organized before implementation details start to sprawl.",
    key: "shape",
    links: [
      {
        href: "/docs/reference/architecture-defaults",
        title: "Architecture Defaults",
      },
      {
        href: "/docs/reference/package-boundaries",
        title: "Package Boundaries",
      },
      {
        href: "/docs/reference/shared-package-candidates",
        title: "Shared Package Candidates",
      },
      { href: "/docs/reference/ui-projects", title: "UI Projects" },
    ],
    title: "Project shape",
    variant: "shape",
  },
  {
    desc: "Setup, dependency choice, deployment, and launch checks kept consistent.",
    key: "operations",
    links: [
      { href: "/docs/reference/config-snippets", title: "Config Snippets" },
      {
        href: "/docs/reference/deployment-defaults",
        title: "Deployment Defaults",
      },
      {
        href: "/docs/reference/default-dependencies",
        title: "Default Dependencies",
      },
      { href: "/docs/reference/launch-checklist", title: "Launch Checklist" },
    ],
    title: "Operations",
    variant: "operations",
  },
  {
    desc: "How the baseline guides coding agents without turning every repo into a copy of it.",
    key: "agents",
    links: [
      { href: "/docs/reference/agent-workflow", title: "Agent Workflow" },
      {
        href: "/docs/reference/agentic-development",
        title: "Agentic Development",
      },
      {
        href: "/docs/adr/0001-agent-skill-packaging",
        title: "Agent Skill Packaging",
      },
    ],
    title: "Agent workflow",
    variant: "agents",
  },
];

const agentSurfaces = [
  { href: "/llms.txt", title: "llms.txt" },
  { href: "/llms-full.txt", title: "llms-full.txt" },
  {
    href: "/docs/adr/0001-agent-skill-packaging",
    title: "How the skill is packaged",
  },
];

function PrincipleRow({
  desc,
  title,
}: {
  readonly desc: string;
  readonly title: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-t border-[var(--sc-border-soft)] py-3 sm:flex-row sm:gap-6">
      <h3 className="shrink-0 text-sm font-medium text-fd-foreground sm:w-[220px]">
        {title}
      </h3>
      <p className="text-sm leading-6 text-fd-muted-foreground">{desc}</p>
    </div>
  );
}

function DocGroupCard({ group }: { readonly group: DocGroup }) {
  const titleId = `doc-group-${group.key}`;
  return (
    <div
      aria-labelledby={titleId}
      className="group rounded-lg border border-[var(--sc-border-soft)] bg-[var(--sc-surface)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(29,29,27,0.06)]"
      role="group"
    >
      <Miniature variant={group.variant} />
      <div className="p-4">
        <h3 className="text-sm font-medium text-fd-foreground" id={titleId}>
          {group.title}
        </h3>
        <p className="mt-1 text-xs leading-5 text-fd-muted-foreground">
          {group.desc}
        </p>
        <div className="mt-3 flex flex-col">
          {group.links.map((link) => (
            <Link
              className={`group/row flex items-center justify-between gap-2 border-t border-[var(--sc-border-soft)] py-2 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground ${focusRing}`}
              href={link.href}
              key={link.href}
            >
              <span>{link.title}</span>
              <span
                aria-hidden
                className="text-fd-muted-foreground transition-transform duration-150 group-hover/row:translate-x-[3px]"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function InstallBlock() {
  return (
    <pre className="overflow-x-auto rounded-lg bg-[var(--sc-ink)] px-4 py-3 font-mono text-sm text-[var(--sc-paper)]">
      <code className="tabular-nums">
        npx skills@latest add howells/scaffold
      </code>
    </pre>
  );
}

const HomePage = () => {
  return (
    <main className="mx-auto flex w-full max-w-[860px] flex-col gap-16 px-6 pb-24 pt-16 sm:gap-[72px] sm:pt-20">
      <section>
        <p className="mb-4 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-fd-muted-foreground">
          A project baseline
        </p>
        <h1 className="max-w-2xl text-2xl font-semibold tracking-tight text-fd-foreground sm:text-[1.75rem]">
          Scaffold
        </h1>
        <p className="mt-4 max-w-[62ch] text-sm leading-7 text-fd-muted-foreground">
          The baseline I start projects from — repo shape, tooling, package
          boundaries, how coding agents fit in, and what has to be true before
          launch. Written for my own repos, and open for anyone to read.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link
            className={`font-medium text-fd-foreground underline decoration-[var(--sc-border)] underline-offset-4 transition-colors hover:decoration-[var(--sc-accent)] ${focusRing}`}
            href="/docs/overview"
          >
            Read the docs
          </Link>
          <Link
            className={`text-fd-muted-foreground transition-colors hover:text-fd-foreground ${focusRing}`}
            href="/docs/principles"
          >
            Principles
          </Link>
          <a
            className={`text-fd-muted-foreground transition-colors hover:text-fd-foreground ${focusRing}`}
            href={GITHUB_URL}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-sm font-medium text-fd-foreground">Principles</h2>
          <span className="text-xs text-fd-muted-foreground">
            the reasoning under the defaults
          </span>
        </div>
        <div className="mt-6">
          {principles.map((item) => (
            <PrincipleRow
              desc={item.desc}
              key={item.title}
              title={item.title}
            />
          ))}
          <div className="border-t border-[var(--sc-border-soft)] pt-3">
            <Link
              className={`inline-flex text-sm font-medium text-[var(--sc-accent)] ${focusRing}`}
              href="/docs/principles"
            >
              All principles →
            </Link>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-fd-foreground">The docs</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-fd-muted-foreground">
          Thirteen chapters, grouped by the question they answer.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {docGroups.map((group) => (
            <DocGroupCard group={group} key={group.key} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-fd-foreground">For agents</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-fd-muted-foreground">
          The docs double as an installable Agent Skill and machine-readable
          surfaces. Install the skill:
        </p>
        <div className="mt-4">
          <InstallBlock />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          {agentSurfaces.map((surface) => (
            <Link
              className={`text-fd-muted-foreground transition-colors hover:text-fd-foreground ${focusRing}`}
              href={surface.href}
              key={surface.href}
            >
              {surface.title}
            </Link>
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--sc-border-soft)] pt-6 text-sm text-fd-muted-foreground">
        <span>Scaffold · Daniel Howells</span>
        <div className="flex items-center gap-4">
          <a
            className={`transition-colors hover:text-fd-foreground ${focusRing}`}
            href={GITHUB_URL}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <ThemeSwitch mode="light-dark-system" />
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
