import type { Metadata } from "next";
import Link from "next/link";

import { HomeTabs } from "@/components/home-tabs";
import { Prose } from "@/components/prose";
import { principleGroups, principlesIntro } from "@/content/principles";
import { siteUrl } from "@/lib/site-url";

const description =
  "The baseline I start every project from: repo shape, tooling, package boundaries, agent workflow, and launch checks, written down and open to read.";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  description,
  openGraph: {
    description,
    title: "Scaffold",
    type: "website",
    url: "/",
  },
  title: "Scaffold",
  twitter: {
    card: "summary_large_image",
    description,
    title: "Scaffold",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  description,
  name: "Scaffold",
  url: siteUrl(),
};

const GITHUB_URL = "https://github.com/howells/scaffold";

const focusRing =
  "rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const eyebrow = "text-xs font-medium text-fd-muted-foreground";
const hairline = "border-t border-border/55";
const linkClass = `text-fd-muted-foreground transition-colors hover:text-fd-foreground ${focusRing}`;

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

function PrinciplesPanel() {
  return (
    <div>
      <div className="flex max-w-[68ch] flex-col gap-3">
        {principlesIntro.map((paragraph) => (
          <p
            className="text-sm leading-[1.7] text-fd-muted-foreground"
            key={paragraph.slice(0, 40)}
          >
            {paragraph}
          </p>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-10">
        {principleGroups.map((group) => (
          <div className={`${hairline} pt-6`} key={group.group}>
            <h3 className={eyebrow}>{group.group}</h3>
            <div className="mt-6 flex flex-col gap-9">
              {group.principles.map((principle) => (
                <article key={principle.title}>
                  <h4 className="text-sm font-medium text-fd-foreground">
                    {principle.title}
                  </h4>
                  <Prose body={principle.body} />
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DocsPanel() {
  return (
    <div>
      <p className="max-w-[62ch] text-sm leading-[1.6] text-fd-muted-foreground">
        Reference chapters, grouped by the question they answer. The full
        write-ups live under{" "}
        <Link className={linkClass} href="/docs/overview">
          /docs
        </Link>
        .
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
    </div>
  );
}

function AgentsPanel() {
  return (
    <div>
      <p className="max-w-[62ch] text-sm leading-[1.6] text-fd-muted-foreground">
        The docs double as an installable Agent Skill and machine-readable
        surfaces. Install the skill:
      </p>
      <pre className="mt-4 overflow-x-auto rounded-lg bg-foreground px-4 py-3 font-mono text-sm text-background dark:border dark:border-border/55 dark:bg-muted dark:text-fd-foreground">
        <code className="tabular-nums">
          npx skills@latest add howells/scaffold
        </code>
      </pre>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
        {agentSurfaces.map((surface) => (
          <Link className={linkClass} href={surface.href} key={surface.href}>
            {surface.title}
          </Link>
        ))}
      </div>
    </div>
  );
}

const HomePage = () => {
  return (
    <main className="mx-auto flex w-full max-w-[860px] flex-col gap-14 px-6 pb-24 pt-16 sm:pt-20">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        type="application/ld+json"
      />
      <header>
        <h1 className="text-sm font-medium text-fd-foreground">Scaffold</h1>
        <p className="mt-2 max-w-[58ch] text-sm leading-[1.65] text-fd-muted-foreground">
          The baseline I start projects from: repo shape, tooling, package
          boundaries, how coding agents fit in, and what has to be true before
          launch. Written for my own repos, and open for anyone to read.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link className={linkClass} href="/docs/overview">
            Read the docs
          </Link>
          <a
            className={linkClass}
            href={GITHUB_URL}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </div>
      </header>

      <HomeTabs
        tabs={[
          {
            content: <PrinciplesPanel />,
            id: "principles",
            label: "Principles",
          },
          { content: <DocsPanel />, id: "docs", label: "The docs" },
          { content: <AgentsPanel />, id: "agents", label: "For agents" },
        ]}
      />

      <footer
        className={`flex flex-wrap items-center justify-between gap-2 pt-6 text-sm text-fd-muted-foreground ${hairline}`}
      >
        <span>Scaffold · Daniel Howells</span>
        <a
          className={linkClass}
          href={GITHUB_URL}
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
};

export default HomePage;
