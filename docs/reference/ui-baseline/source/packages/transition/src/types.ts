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

export type MotionPresetName = "snappy" | "smooth" | "bouncy" | "reduced";

export interface MotionVariants {
  backdrop?: MotionPresetName;
  content?: MotionPresetName;
  trigger?: MotionPresetName;
}

export type MotionProp = MotionPresetName | MotionVariants;

export interface DragSpringConfig {
  damping: number;
  restDelta: number;
  stiffness: number;
}

export interface MotionPreset {
  drag: DragSpringConfig;
  transition: Transition;
}

export interface DismissibleConfig {
  /** Distance in px to trigger dismissal (default: 100) */
  threshold?: number;
  /** Velocity in px/s to trigger dismissal (default: 500) */
  velocity?: number;
}

export interface TransitionContextValue {
  dismissible: boolean | DismissibleConfig;
  layoutId: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  preset: MotionPreset;
  variants?: MotionVariants;
}
