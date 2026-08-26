"use client";

import { Dialog } from "@base-ui/react/dialog";
import { LayoutGroup, useReducedMotion } from "motion/react";
import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useCallback,
  useId,
  useState,
} from "react";

import { TransitionContext } from "./context";
import { PRESETS } from "./presets";
import type {
  DismissibleConfig,
  MotionPresetName,
  MotionVariants,
} from "./types";

export interface TransitionRootProps extends Omit<
  ComponentPropsWithoutRef<typeof Dialog.Root>,
  "open" | "onOpenChange"
> {
  children: ReactNode;
  /** Whether dragging can dismiss the content (default: true) */
  dismissible?: boolean | DismissibleConfig;
  /** Layout ID for shared element transition (auto-generated if omitted) */
  layoutId?: string;
  motion?: MotionPresetName | MotionVariants;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Force reduced motion regardless of system preference */
  reduceMotion?: boolean;
}

function TransitionRoot({
  children,
  dismissible = true,
  layoutId: layoutIdProp,
  motion: motionProp = "smooth",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  reduceMotion: reduceMotionProp,
  ...dialogProps
}: TransitionRootProps) {
  const generatedId = useId();
  const layoutId = layoutIdProp ?? `transition-${generatedId}`;
  const systemReducedMotion = useReducedMotion() ?? false;
  const shouldReduce = reduceMotionProp ?? systemReducedMotion;

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      controlledOnOpenChange?.(nextOpen);
    },
    [isControlled, controlledOnOpenChange]
  );

  const globalPresetName: MotionPresetName =
    typeof motionProp === "string" ? motionProp : "smooth";
  const variants: MotionVariants | undefined =
    typeof motionProp === "object" ? motionProp : undefined;

  const preset = shouldReduce ? PRESETS.reduced : PRESETS[globalPresetName];

  return (
    <TransitionContext.Provider
      value={{
        dismissible,
        layoutId,
        onOpenChange,
        open,
        preset,
        variants,
      }}
    >
      <Dialog.Root onOpenChange={onOpenChange} open={open} {...dialogProps}>
        <LayoutGroup id={layoutId}>{children}</LayoutGroup>
      </Dialog.Root>
    </TransitionContext.Provider>
  );
}

export { TransitionRoot };
