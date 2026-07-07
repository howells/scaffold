"use client";

import { Dialog } from "@base-ui/react/dialog";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

const TransitionTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<typeof Dialog.Title>
>((props, ref) => {
  return <Dialog.Title data-slot="transition-title" ref={ref} {...props} />;
});

TransitionTitle.displayName = "TransitionTitle";

export { TransitionTitle };
