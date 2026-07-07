"use client";

import { Dialog } from "@base-ui/react/dialog";
import { motion } from "motion/react";
import { forwardRef } from "react";

import { useTransitionContext } from "./context";
import { resolvePreset } from "./presets";
import type { MotionPresetName } from "./types";

export interface TransitionOverlayProps {
  className?: string;
  /** Override motion preset for the overlay */
  motion?: MotionPresetName;
  style?: React.CSSProperties;
}

const TransitionOverlay = forwardRef<HTMLDivElement, TransitionOverlayProps>(
  ({ className, motion: motionOverride, style }, ref) => {
    const ctx = useTransitionContext();
    const resolved = resolvePreset(
      "backdrop",
      motionOverride,
      "smooth",
      ctx.variants,
      false,
    );

    return (
      <Dialog.Backdrop
        ref={ref}
        render={
          <motion.div
            animate={{ opacity: 1 }}
            className={className}
            data-slot="transition-overlay"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            style={style}
            transition={resolved.transition}
          />
        }
      />
    );
  },
);

TransitionOverlay.displayName = "TransitionOverlay";

export { TransitionOverlay };
