"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence } from "motion/react";
import type { ReactNode } from "react";

import { useTransitionContext } from "./context";

export interface TransitionPortalProps {
  children: ReactNode;
  /** Container element for the portal (default: document.body) */
  container?: HTMLElement;
}

function TransitionPortal({ children, container }: TransitionPortalProps) {
  const { open } = useTransitionContext();

  return (
    <AnimatePresence>
      {open && (
        <Dialog.Portal container={container} keepMounted>
          {children}
        </Dialog.Portal>
      )}
    </AnimatePresence>
  );
}

export { TransitionPortal };
