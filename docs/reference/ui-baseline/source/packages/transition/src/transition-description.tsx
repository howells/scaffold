"use client";

import { Dialog } from "@base-ui/react/dialog";
import { type ComponentPropsWithoutRef, forwardRef } from "react";

const TransitionDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<typeof Dialog.Description>
>((props, ref) => {
  return (
    <Dialog.Description
      data-slot="transition-description"
      ref={ref}
      {...props}
    />
  );
});

TransitionDescription.displayName = "TransitionDescription";

export { TransitionDescription };
