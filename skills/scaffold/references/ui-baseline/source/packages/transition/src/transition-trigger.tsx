"use client";

import { Dialog } from "@base-ui/react/dialog";
import { motion } from "motion/react";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

import { useTransitionContext } from "./context";
import { resolvePreset } from "./presets";
import type { MotionPresetName } from "./types";

export interface TransitionTriggerProps extends ComponentPropsWithoutRef<
  typeof Dialog.Trigger
> {
  motion?: MotionPresetName;
}

const TransitionTrigger = forwardRef<HTMLButtonElement, TransitionTriggerProps>(
  ({ children, motion: motionOverride, ...props }, ref) => {
    const ctx = useTransitionContext();

    const resolved = resolvePreset(
      "trigger",
      motionOverride,
      "smooth",
      ctx.variants,
      false
    );

    return (
      <Dialog.Trigger
        ref={ref}
        render={
          <motion.button
            data-slot="transition-trigger"
            layout
            layoutCrossfade={false}
            layoutId={`${ctx.layoutId}-shared`}
            style={{ zIndex: ctx.open ? 0 : 1 }}
            transition={resolved.transition}
            type="button"
          />
        }
        {...props}
      >
        {children}
      </Dialog.Trigger>
    );
  }
);

TransitionTrigger.displayName = "TransitionTrigger";

export { TransitionTrigger };
