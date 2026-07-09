import type { CSSProperties } from "react";

/**
 * Decorative miniatures for the homepage doc-group cards. Pure presentational
 * divs (not SVG) so they never become focus stops; every instance is rendered
 * inside an `aria-hidden` preview panel. Colors come from `--sc-*` tokens only.
 */
export type MiniatureVariant = "start" | "shape" | "operations" | "agents";

const panelStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, color-mix(in oklab, var(--sc-accent) 6%, transparent), transparent 50%), var(--sc-surface-soft)",
};

const bar =
  "rounded-[2px] bg-[var(--sc-surface)] ring-1 ring-[var(--sc-border-soft)]";

function Inner({ variant }: { readonly variant: MiniatureVariant }) {
  switch (variant) {
    case "start":
      return (
        <div className="flex w-[104px] flex-col gap-[7px]">
          <div className={`${bar} h-[10px] w-full`} />
          <div className={`${bar} ml-3 h-[10px] w-[calc(100%-0.75rem)]`} />
          <div className={`${bar} ml-3 h-[10px] w-[calc(100%-0.75rem)]`} />
        </div>
      );
    case "shape":
      return (
        <div className="flex h-[64px] w-[104px] gap-2">
          <div className={`${bar} h-full flex-1`} />
          <div className="flex flex-1 flex-col gap-2">
            <div className={`${bar} h-full w-full`} />
            <div className={`${bar} h-full w-full`} />
          </div>
        </div>
      );
    case "operations":
      return (
        <div className="flex w-[104px] flex-col gap-[9px]">
          {[true, true, false].map((done, i) => (
            <div className="flex items-center gap-2" key={i}>
              <div
                className={`size-[10px] shrink-0 rounded-full ring-1 ring-[var(--sc-border)] ${
                  done ? "bg-[var(--sc-accent)]" : "bg-[var(--sc-surface)]"
                }`}
              />
              <div className={`${bar} h-[8px] flex-1`} />
            </div>
          ))}
        </div>
      );
    case "agents":
      return (
        <div className="relative h-[64px] w-[104px]">
          <div
            className={`${bar} absolute left-0 top-0 h-[40px] w-[76px] opacity-50`}
          />
          <div
            className={`${bar} absolute left-[14px] top-[12px] h-[40px] w-[76px] opacity-75`}
          />
          <div
            className={`${bar} absolute left-[28px] top-[24px] h-[40px] w-[76px]`}
          />
        </div>
      );
  }
}

export function Miniature({ variant }: { readonly variant: MiniatureVariant }) {
  return (
    <div
      aria-hidden
      className="flex aspect-[5/3] items-center justify-center overflow-hidden rounded-t-lg border-b border-[var(--sc-border-soft)]"
      style={panelStyle}
    >
      <div className="transition-transform duration-200 ease-out motion-safe:group-hover:-translate-y-[3px]">
        <Inner variant={variant} />
      </div>
    </div>
  );
}
