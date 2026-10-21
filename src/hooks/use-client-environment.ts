"use client";

import { useSyncExternalStore } from "react";
import { isIOS, isStandalone } from "@/browser/platform";
import { ScreenWakeLock } from "@/browser/wake-lock";

export interface ClientEnvironment {
  isIOS: boolean;
  isStandalone: boolean;
  wakeLockSupported: boolean;
}

let snapshot: ClientEnvironment | null = null;

function getSnapshot(): ClientEnvironment {
  snapshot ??= {
    isIOS: isIOS(),
    isStandalone: isStandalone(),
    wakeLockSupported: ScreenWakeLock.isSupported(),
  };
  return snapshot;
}

const subscribe = () => () => {};

/** Device facts, read only in the browser (`null` during server rendering and hydration). */
export function useClientEnvironment(): ClientEnvironment | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
