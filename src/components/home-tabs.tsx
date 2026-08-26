"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export interface HomeTab {
  readonly content: ReactNode;
  readonly id: string;
  readonly label: string;
}

/**
 * Thin client shell for the homepage tabs. Panel content is server-rendered and
 * passed in as `content`, so every panel stays in the DOM (crawlable, and
 * present for the agent surface); this component only toggles visibility.
 */
export function HomeTabs({ tabs }: { readonly tabs: readonly HomeTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");

  return (
    <div>
      <div
        aria-label="Sections"
        className="border-border/55 flex gap-6 border-b"
        role="tablist"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              aria-controls={`panel-${tab.id}`}
              aria-selected={selected}
              className={`focus-visible:outline-ring -mb-px border-b-2 pb-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                selected
                  ? "border-ring text-fd-foreground"
                  : "text-fd-muted-foreground hover:text-fd-foreground border-transparent"
              }`}
              id={`tab-${tab.id}`}
              key={tab.id}
              onClick={() => {
                setActive(tab.id);
              }}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          aria-labelledby={`tab-${tab.id}`}
          className="pt-8"
          hidden={tab.id !== active}
          id={`panel-${tab.id}`}
          key={tab.id}
          role="tabpanel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
