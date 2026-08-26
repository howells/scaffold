import { durations } from "./durations";
import { easings } from "./easings";
import { springs } from "./springs";

export const presets = {
  dialogOpen: { duration: durations.normal, ease: easings.customOut },
  dialogClose: { duration: durations.quick, ease: easings.customIn },

  hoverLift: springs.snappy,
  hoverSettle: springs.natural,

  slideIn: { duration: durations.normal, ease: easings.customOut },
  slideOut: { duration: durations.quick, ease: easings.customIn },

  fadeIn: { duration: durations.quick, ease: easings.customOut },
  fadeOut: { duration: durations.quick, ease: easings.customIn },

  shake: { duration: durations.normal, ease: easings.customOut },
} as const;

export const shakeKeyframes = [0, -6, 6, -4, 4, 0];

export type Preset = keyof typeof presets;
