export type EasingTuple = [number, number, number, number];

const SMOOTH_EASING: EasingTuple = [0.4, 0, 0.2, 1];
const CUSTOM_IN_EASING: EasingTuple = [0.55, 0.085, 0.68, 0.53];
const CUSTOM_OUT_EASING: EasingTuple = [0.165, 0.84, 0.44, 1];
const CUSTOM_EXPAND_EASING: EasingTuple = [0.25, 0.46, 0.45, 0.94];
const CUSTOM_GENTLE_EASING: EasingTuple = [0.25, 0.1, 0.12, 1];

export const easings = {
  smooth: SMOOTH_EASING,
  customIn: CUSTOM_IN_EASING,
  customOut: CUSTOM_OUT_EASING,
  customExpand: CUSTOM_EXPAND_EASING,
  customGentle: CUSTOM_GENTLE_EASING,
} as const;

export const easingsCSS = {
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
  customIn: "cubic-bezier(0.55, 0.085, 0.68, 0.53)",
  customOut: "cubic-bezier(0.165, 0.84, 0.44, 1)",
  customExpand: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  customGentle: "cubic-bezier(0.25, 0.1, 0.12, 1)",
} as const;

export type Easing = keyof typeof easings;
