import type { Metadata } from "next";
import Link from "next/link";

import { principleGroups, principlesIntro } from "@/content/principles";

export const metadata: Metadata = {
  description:
    "How I start projects: the principles, defaults, and docs that keep repos from drifting.",
  title: "Scaffold",
};

const GITHUB_URL = "https://github.com/howells/scaffold";

const focusRing =
  "rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--sc-accent)]";

const eyebrow =
  "text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-fd-muted-foreground";
const hairline = "border-t border-[var(--sc-border-soft)]";

interface DocLink {
  readonly href: string;
  readonly title: string;
}

interface DocGroup {
  readonly desc: string;
  readonly key: string;
  readonly links: readonly DocLink[];
  readonly title: string;
}

const docGroups: readonly DocGroup[] = [
  {
    desc: "Install the baseline, pick a repo shape, and settle the versions up front.",
    key: "start",
    links: [
      { href: "/docs/getting-started", title: "Getting Started" },
      { href: "/docs/reference/repo-archetypes", title: "Repo Archetypes" },
      { href: "/docs/reference/stack-decisions", title: "Stack Decisions" },
      { href: "/docs/reference/stack-in-practice", title: "Stack in Practice" },
    ],
    title: "Start here",
  },
  {
    desc: "How a repo is organised before implementation details start to sprawl.",
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

function TextLink({
  children,
  external,
  href,
}: {
  readonly children: React.ReactNode;
  readonly external?: boolean;
  readonly href: string;
}) {
  const className = `text-fd-muted-foreground transition-colors hover:text-fd-foreground ${focusRing}`;
  if (external) {
    return (
      <a className={className} href={href} rel="noreferrer" target="_blank">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

const HomePage = () => {
  return (
    <main className="mx-auto flex w-full max-w-[860px] flex-col gap-16 px-6 pb-24 pt-16 sm:gap-20 sm:pt-20">
      <header>
        <p className={`mb-3 ${eyebrow}`}>A project baseline</p>
        <h1 className="text-sm font-medium text-fd-foreground">Scaffold</h1>
        <p className="mt-2 max-w-[58ch] text-sm leading-[1.65] text-fd-muted-foreground">
          The baseline I start projects from: repo shape, tooling, package
          boundaries, how coding agents fit in, and what has to be true before
          launch. Written for my own repos, and open for anyone to read.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <TextLink href="/docs/overview">Read the docs</TextLink>
          <TextLink external href={GITHUB_URL}>
            GitHub
          </TextLink>
        </div>
      </header>

      <section>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-sm font-medium text-fd-foreground">Principles</h2>
          <span className="text-sm text-fd-muted-foreground">
            how I build software
          </span>
        </div>
        <p className="mt-3 max-w-[62ch] text-sm leading-[1.65] text-fd-muted-foreground">
          {principlesIntro[0]}
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {principleGroups.map((group) => (
            <div className={`${hairline} pt-5`} key={group.group}>
              <h3 className={eyebrow}>{group.group}</h3>
              <dl className="mt-4 flex flex-col">
                {group.principles.map((principle) => (
                  <div
                    className={`grid gap-1 py-3 ${hairline} first:border-t-0 sm:grid-cols-[minmax(0,17rem)_1fr] sm:gap-6`}
                    key={principle.title}
                  >
                    <dt className="text-sm font-medium text-fd-foreground">
                      {principle.title}
                    </dt>
                    <dd className="text-sm leading-[1.6] text-fd-muted-foreground">
                      {principle.summary}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <div className={`mt-8 ${hairline} pt-5`}>
          <Link
            className={`inline-flex text-sm font-medium text-[var(--sc-accent)] ${focusRing}`}
            href="/docs/principles"
          >
            Read the full write-ups →
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-fd-foreground">The docs</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-[1.6] text-fd-muted-foreground">
          Reference chapters, grouped by the question they answer.
        </p>
        <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {docGroups.map((group) => (
            <div key={group.key}>
              <h3 className="text-sm font-medium text-fd-foreground">
                {group.title}
              </h3>
              <p className="mt-1 text-sm leading-[1.55] text-fd-muted-foreground">
                {group.desc}
              </p>
              <div className="mt-3 flex flex-col">
                {group.links.map((link) => (
                  <Link
                    className={`group/row flex items-center justify-between gap-2 py-2 text-sm text-fd-muted-foreground transition-colors hover:text-fd-foreground ${hairline} ${focusRing}`}
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
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-fd-foreground">For agents</h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-[1.6] text-fd-muted-foreground">
          The docs double as an installable Agent Skill and machine-readable
          surfaces. Install the skill:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-[var(--sc-ink)] px-4 py-3 font-mono text-sm text-[var(--sc-paper)]">
          <code className="tabular-nums">
            npx skills@latest add howells/scaffold
          </code>
        </pre>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          {agentSurfaces.map((surface) => (
            <TextLink href={surface.href} key={surface.href}>
              {surface.title}
            </TextLink>
          ))}
        </div>
      </section>

      <footer
        className={`flex flex-wrap items-center justify-between gap-2 pt-6 text-sm text-fd-muted-foreground ${hairline}`}
      >
        <span>Scaffold · Daniel Howells</span>
        <TextLink external href={GITHUB_URL}>
          GitHub
        </TextLink>
      </footer>
    </main>
  );
};

export default HomePage;
