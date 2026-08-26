/** Seconds for Motion; use `durationMs` for CSS and timers. */
export const durations = {
  instant: 0,
  quick: 0.12,
  normal: 0.25,
  moderate: 0.4,
  slow: 1.0,
} as const;

export const durationMs = {
  instant: 0,
  quick: 120,
  normal: 250,
  moderate: 400,
  slow: 1000,
} as const;

export type Duration = keyof typeof durations;
