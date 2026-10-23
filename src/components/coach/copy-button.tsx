"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};
const FEEDBACK_MS = 2500;

type Status = "idle" | "copied" | "failed";

/** Copies `value` to the clipboard, so coaches can paste the code or link into a chat. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("Share");
  const [status, setStatus] = useState<Status>("idle");
  // Disabled until hydrated: a click before React takes over would do nothing.
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (status === "idle") return;
    const timeout = setTimeout(() => setStatus("idle"), FEEDBACK_MS);
    return () => clearTimeout(timeout);
  }, [status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
    } catch {
      // Clipboard access can be denied (permissions, insecure origin).
      setStatus("failed");
    }
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={copy}
        disabled={!hydrated}
        className="inline-flex min-h-11 items-center rounded-xl border border-coach-line bg-coach-surface px-4 font-semibold hover:bg-coach-bg disabled:opacity-60"
      >
        {label}
      </button>
      <span role="status" className="text-sm font-semibold text-coach-muted">
        {status === "copied" && t("copied")}
        {status === "failed" && t("copyFailed")}
      </span>
    </span>
  );
}
