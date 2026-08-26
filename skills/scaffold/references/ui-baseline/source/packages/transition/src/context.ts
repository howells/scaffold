"use client";

import { createContext, useContext } from "react";

import type { TransitionContextValue } from "./types";

export const TransitionContext = createContext<TransitionContextValue | null>(
  null
);

export function useTransitionContext(): TransitionContextValue {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error(
      "Transition components must be used within <Transition.Root>"
    );
  }
  return ctx;
}
