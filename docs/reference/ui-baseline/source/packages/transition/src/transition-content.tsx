"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  type MotionStyle,
  motion,
  type PanInfo,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { forwardRef, useCallback, useMemo } from "react";

import { useTransitionContext } from "./context";
import {
  calculateResistance,
  DEFAULT_DISTANCE_THRESHOLD,
  DEFAULT_VELOCITY_THRESHOLD,
  OPACITY_INPUT,
  OPACITY_OUTPUT,
  SCALE_INPUT,
  SCALE_OUTPUT,
} from "./physics";
import { resolvePreset } from "./presets";
import type { DismissibleConfig, MotionPresetName } from "./types";

export interface TransitionContentProps {
  children?: React.ReactNode;
  className?: string;
  /** Motion preset override for this content panel, independent of the root preset. */
  motion?: MotionPresetName;
  style?: React.CSSProperties;
}

const TransitionContent = forwardRef<HTMLDivElement, TransitionContentProps>(
  ({ children, className, motion: motionOverride, style }, ref) => {
    const ctx = useTransitionContext();
    const resolved = resolvePreset(
      "content",
      motionOverride,
      "smooth",
      ctx.variants,
      false
    );

    const isDismissible = ctx.dismissible !== false;

    const dismissConfig: DismissibleConfig =
      typeof ctx.dismissible === "object" ? ctx.dismissible : {};
    const distanceThreshold =
      dismissConfig.threshold ?? DEFAULT_DISTANCE_THRESHOLD;
    const velocityThreshold =
      dismissConfig.velocity ?? DEFAULT_VELOCITY_THRESHOLD;

    const dragX = useMotionValue(0);
    const dragY = useMotionValue(0);
    const springX = useSpring(dragX, resolved.drag);
    const springY = useSpring(dragY, resolved.drag);

    const distance = useTransform(() =>
      Math.hypot(springX.get(), springY.get())
    );
    const scaleMotion = useTransform(distance, SCALE_INPUT, SCALE_OUTPUT);
    const opacityMotion = useTransform(distance, OPACITY_INPUT, OPACITY_OUTPUT);
    const resistance = useTransform(distance, calculateResistance);

    const handleDrag = useCallback(
      (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const r = resistance.get();
        dragX.set(info.offset.x * r);
        dragY.set(info.offset.y * r);
      },
      [dragX, dragY, resistance]
    );

    const handleDragEnd = useCallback(
      (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const speed = Math.hypot(info.velocity.x, info.velocity.y);
        const dist = distance.get();

        if (speed > velocityThreshold || dist > distanceThreshold) {
          ctx.onOpenChange(false);
        }

        dragX.set(0);
        dragY.set(0);
      },
      [
        ctx.onOpenChange,
        distance,
        distanceThreshold,
        dragX,
        dragY,
        velocityThreshold,
      ]
    );

    const motionStyle = useMemo(
      (): MotionStyle => ({
        cursor: isDismissible ? "grab" : undefined,
        opacity: opacityMotion,
        scale: scaleMotion,
        x: springX,
        y: springY,
        ...style,
      }),
      [isDismissible, opacityMotion, scaleMotion, springX, springY, style]
    );

    return (
      <Dialog.Popup
        ref={ref}
        render={
          <motion.div
            className={className}
            data-slot="transition-content"
            drag={isDismissible}
            dragConstraints={{ bottom: 0, left: 0, right: 0, top: 0 }}
            dragElastic={0}
            layout
            layoutId={`${ctx.layoutId}-shared`}
            onDrag={isDismissible ? handleDrag : undefined}
            onDragEnd={isDismissible ? handleDragEnd : undefined}
            style={motionStyle}
            transition={resolved.transition}
          />
        }
      >
        {children}
      </Dialog.Popup>
    );
  }
);

TransitionContent.displayName = "TransitionContent";

export { TransitionContent };
