/**
 * @patternmode/transition
 *
 * Shared element transitions with physics-based drag dismissal.
 * Built on Base UI Dialog + Motion.
 *
 * Inspired by Cambio (https://github.com/raphaelsalaja/cambio)
 * by Raphael Salaja. Reimplemented for Base UI primitives.
 */

import type { Transition } from "motion/react";

/** Named motion preset */
export type MotionPresetName = "snappy" | "smooth" | "bouncy" | "reduced";

/** Per-component motion variant overrides */
export interface MotionVariants {
  backdrop?: MotionPresetName;
  content?: MotionPresetName;
  trigger?: MotionPresetName;
}

/** Motion prop: a single preset name, per-component variants, or nothing */
export type MotionProp = MotionPresetName | MotionVariants;

/** Spring config for drag physics */
export interface DragSpringConfig {
  damping: number;
  restDelta: number;
  stiffness: number;
}

/** Resolved preset with transition timing and drag physics */
export interface MotionPreset {
  drag: DragSpringConfig;
  transition: Transition;
}

/** Dismissal behaviour config */
export interface DismissibleConfig {
  /** Distance in px to trigger dismissal (default: 100) */
  threshold?: number;
  /** Velocity in px/s to trigger dismissal (default: 500) */
  velocity?: number;
}

/** Context value shared between all Transition components */
export interface TransitionContextValue {
  dismissible: boolean | DismissibleConfig;
  layoutId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  preset: MotionPreset;
  variants?: MotionVariants;
}
