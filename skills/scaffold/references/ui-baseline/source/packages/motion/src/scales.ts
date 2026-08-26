export const scales = {
  press: 0.97,
  pressDeep: 0.95,
  hover: 1.02,
  hoverLift: 1.05,
} as const;

export type Scale = keyof typeof scales;
