"use client";

import { useEffect } from "react";
import { registerOfflineSupport } from "@/browser/offline";

/** Turns on offline reloads for phone pages. Production only: a worker would fight dev reloads. */
export function OfflineSupport() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    // Best effort, like every device feature: the timer works without it.
    registerOfflineSupport().catch((error: unknown) => {
      console.warn("Offline support unavailable", error);
    });
  }, []);
  return null;
}
