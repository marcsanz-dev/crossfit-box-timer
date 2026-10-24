"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import {
  CODE_LENGTH,
  formatCode,
  isValidCode,
  normalizeCode,
} from "@/lib/share/code";
import { getStoredShareCode, SESSION_STORAGE_KEY } from "@/lib/timer/session";
import { InstallHint } from "./install-hint";

const noSubscribe = () => () => {};

function readLastCode(): string | null {
  try {
    return getStoredShareCode(localStorage.getItem(SESSION_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Phone home: type the coach's code. This is the installed web app's start screen. */
export function CodeEntry() {
  const t = useTranslations("PhoneHome");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const lastCode = useSyncExternalStore(noSubscribe, readLastCode, () => null);
  // Disabled until hydrated: React would otherwise wipe anything typed into the
  // server-rendered input when it takes over.
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  const open = () => {
    const code = normalizeCode(value);
    if (!isValidCode(code)) {
      setInvalid(true);
      return;
    }
    router.push(`/t/${code}`);
  };

  return (
    <main className="mx-auto flex h-full w-full max-w-xl flex-col justify-center gap-[4cqmin] px-[6cqmin] py-[4cqmin]">
      <header className="flex flex-col gap-[1.5cqmin]">
        <h1 className="text-[clamp(1.75rem,9cqmin,3.5rem)] leading-tight font-black">
          {t("title")}
        </h1>
        <p className="text-[clamp(1rem,4.4cqmin,1.4rem)] text-phone-dim">
          {t("intro")}
        </p>
      </header>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          open();
        }}
        className="flex flex-col gap-[2.5cqmin]"
      >
        <label
          htmlFor="code"
          className="text-[clamp(0.9rem,3.8cqmin,1.1rem)] font-semibold"
        >
          {t("codeLabel")}
        </label>
        <div className="flex gap-[2.5cqmin]">
          <input
            id="code"
            name="code"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            maxLength={CODE_LENGTH + 2}
            placeholder="K7Q M4P"
            value={value}
            disabled={!hydrated}
            aria-invalid={invalid ? true : undefined}
            aria-describedby={invalid ? "code-error" : undefined}
            onChange={(e) => {
              setInvalid(false);
              setValue(e.target.value.toUpperCase());
            }}
            className="h-[clamp(3.5rem,16cqmin,5rem)] min-w-0 flex-1 rounded-2xl border-2 border-phone-line bg-phone-surface px-[4cqmin] font-mono text-[clamp(1.6rem,8cqmin,2.75rem)] font-bold tracking-[0.2em] uppercase placeholder:text-phone-line focus-visible:border-phone-fg focus-visible:outline-none aria-[invalid=true]:border-phone-alert"
          />
          <button
            type="submit"
            disabled={!hydrated}
            className="h-[clamp(3.5rem,16cqmin,5rem)] shrink-0 rounded-2xl bg-phone-go px-[5cqmin] text-[clamp(1.1rem,5.5cqmin,1.75rem)] font-black text-black"
          >
            {t("open")}
          </button>
        </div>
        <p
          id="code-error"
          aria-live="polite"
          className="min-h-[1.5em] text-[clamp(0.9rem,3.8cqmin,1.1rem)] text-phone-alert"
        >
          {invalid ? t("invalid") : null}
        </p>
      </form>

      <nav className="flex flex-col gap-[2cqmin] text-[clamp(0.95rem,4cqmin,1.2rem)]">
        {lastCode && (
          <Link
            href={`/t/${lastCode}`}
            className="font-semibold text-phone-prep underline-offset-4 hover:underline"
          >
            {t("last", { code: formatCode(lastCode) })}
          </Link>
        )}
        <Link
          href="/t/demo"
          className="text-phone-dim underline-offset-4 hover:underline"
        >
          {t("demos")}
        </Link>
        <InstallHint />
      </nav>
    </main>
  );
}
