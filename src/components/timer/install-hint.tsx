"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import {
  canPromptInstall,
  promptInstall,
  subscribeInstallPrompt,
} from "@/browser/install-prompt";
import { useClientEnvironment } from "@/hooks/use-client-environment";

/**
 * Install guidance on the phone home: a button where the browser supports it
 * (Android), the Share-menu steps on iPhone, nothing once installed.
 */
export function InstallHint() {
  const t = useTranslations("PhoneHome");
  const env = useClientEnvironment();
  const canPrompt = useSyncExternalStore(
    subscribeInstallPrompt,
    canPromptInstall,
    () => false,
  );

  if (!env || env.isStandalone) return null;
  if (canPrompt) {
    return (
      <button
        type="button"
        onClick={() => void promptInstall()}
        className="self-start font-semibold text-phone-fg underline underline-offset-4"
      >
        {t("install")}
      </button>
    );
  }
  if (env.isIOS) return <p className="text-phone-dim">{t("installIos")}</p>;
  return null;
}
