/**
 * @patternmode/transition
 *
 * Shared element transitions with physics-based drag dismissal.
 * Built on Base UI Dialog + Motion.
 *
 * Inspired by Cambio (https://github.com/raphaelsalaja/cambio)
 * by Raphael Salaja.
 *
 * @example
 * ```tsx
 * import { Transition } from "@patternmode/transition";
 *
 * <Transition.Root motion="smooth">
 *   <Transition.Trigger className="...">
 *     Open
 *   </Transition.Trigger>
 *   <Transition.Portal>
 *     <Transition.Overlay className="fixed inset-0 bg-black/40" />
 *     <Transition.Content className="fixed inset-0 grid place-items-center">
 *       <div className="bg-white rounded-lg p-6">
 *         <Transition.Title>Title</Transition.Title>
 *         <Transition.Description>Description</Transition.Description>
 *         <Transition.Close>Close</Transition.Close>
 *       </div>
 *     </Transition.Content>
 *   </Transition.Portal>
 * </Transition.Root>
 * ```
 */

import { TransitionClose } from "./transition-close";
import {
  TransitionContent,
  type TransitionContentProps,
} from "./transition-content";
import { TransitionDescription } from "./transition-description";
import {
  TransitionOverlay,
  type TransitionOverlayProps,
} from "./transition-overlay";
import {
  TransitionPortal,
  type TransitionPortalProps,
} from "./transition-portal";
import { TransitionRoot, type TransitionRootProps } from "./transition-root";
import { TransitionTitle } from "./transition-title";
import {
  TransitionTrigger,
  type TransitionTriggerProps,
} from "./transition-trigger";

/** Compound component namespace */
const Transition = {
  Close: TransitionClose,
  Content: TransitionContent,
  Description: TransitionDescription,
  Overlay: TransitionOverlay,
  Portal: TransitionPortal,
  Root: TransitionRoot,
  Title: TransitionTitle,
  Trigger: TransitionTrigger,
};

// Preset system
export { PRESETS, resolvePreset } from "./presets";
// Types
export type {
  DismissibleConfig,
  DragSpringConfig,
  MotionPreset,
  MotionPresetName,
  MotionProp,
  MotionVariants,
} from "./types";
// Named exports for tree-shaking
export {
  Transition,
  TransitionClose,
  TransitionContent,
  type TransitionContentProps,
  TransitionDescription,
  TransitionOverlay,
  type TransitionOverlayProps,
  TransitionPortal,
  type TransitionPortalProps,
  TransitionRoot,
  type TransitionRootProps,
  TransitionTitle,
  TransitionTrigger,
  type TransitionTriggerProps,
};
