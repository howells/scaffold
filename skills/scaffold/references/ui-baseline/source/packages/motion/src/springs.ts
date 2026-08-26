export const springs = {
  soft: { type: "spring", stiffness: 120, damping: 18, mass: 1 },
  subtle: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
  natural: { type: "spring", stiffness: 200, damping: 20, mass: 1 },
  playful: { type: "spring", stiffness: 170, damping: 15, mass: 1 },
  bouncy: { type: "spring", stiffness: 260, damping: 12, mass: 1 },
  snappy: { type: "spring", stiffness: 400, damping: 28, mass: 0.8 },
  stiff: { type: "spring", stiffness: 500, damping: 30, mass: 1 },
  swift: { type: "spring", stiffness: 500, damping: 30, mass: 0.5 },
} as const;

export type SpringType = keyof typeof springs;
