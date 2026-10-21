"use client";

import { useEffect, useState, type ReactNode } from "react";

/** An alert that hides itself after a while, so it never covers the clock for long. */
export function TransientAlert({
  children,
  durationMs = 8000,
}: {
  children: ReactNode;
  durationMs?: number;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(id);
  }, [durationMs]);

  if (!visible) return null;
  return (
    <p
      role="alert"
      className="absolute inset-x-3 top-3 z-20 rounded-xl bg-phone-prep px-4 py-2 text-center text-base font-semibold text-black"
    >
      {children}
    </p>
  );
}
