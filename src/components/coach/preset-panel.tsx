"use client";

import { useTranslations } from "next-intl";
import { useId, useState, useTransition, type KeyboardEvent } from "react";
import { createShareAction } from "@/app/[locale]/coach/actions";
import {
  deletePresetAction,
  duplicatePresetAction,
  type PresetResult,
} from "@/app/[locale]/coach/preset-actions";
import { useModeLabel } from "@/components/timer/use-mode-label";
import type { PresetLists, PresetSummary } from "@/db/presets";
import { useRouter } from "@/i18n/navigation";
import { MAX_PRESETS_PER_COACH } from "@/lib/coach/preset";

export interface EditingPreset {
  id: string;
  name: string;
}

type Tab = "mine" | "library";
type PresetError = Extract<PresetResult, { ok: false }>["error"];

/** Message for a failed preset action. */
export function usePresetErrorText() {
  const t = useTranslations("Presets");
  const tb = useTranslations("Builder");
  return (error: PresetError): string => {
    switch (error) {
      case "session":
        return tb("errorSession");
      case "noName":
        return t("errorNoName");
      case "limit":
        return t("errorLimit", { max: MAX_PRESETS_PER_COACH });
      case "notFound":
        return t("errorNotFound");
      case "invalid":
      case "server":
        return t("errorServer");
    }
  };
}

/**
 * The coach's saved workouts and the Box library (other coaches' presets,
 * read-only but duplicable), as two tabs above the builder.
 */
export function PresetPanel({
  lists,
  editingId,
  onLoad,
  onDeleted,
}: {
  /** null when the presets couldn't be loaded; the builder still works. */
  lists: PresetLists | null;
  editingId: string | null;
  onLoad: (preset: PresetSummary, own: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("Presets");
  const tb = useTranslations("Builder");
  const errorText = usePresetErrorText();
  const router = useRouter();
  const baseId = useId();
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("mine");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (
    action: () => Promise<PresetResult>,
    onOk: (result: Extract<PresetResult, { ok: true }>) => void,
  ) => {
    setStatus(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) onOk(result);
      else setStatus(errorText(result.error));
    });
  };

  // Straight to the phone, without loading the preset into the form first.
  const send = (preset: PresetSummary) => {
    setStatus(null);
    setSendingId(preset.id);
    startTransition(async () => {
      const result = await createShareAction(preset.workout);
      if (result.ok) {
        router.push(`/coach/share/${result.code}`);
        return;
      }
      setSendingId(null);
      setStatus(
        tb(result.error === "session" ? "errorSession" : "errorServer"),
      );
    });
  };

  const duplicate = (preset: PresetSummary) =>
    run(
      () => duplicatePresetAction(preset.id),
      () => {
        setTab("mine");
        setStatus(t("duplicated", { name: preset.workout.name ?? "" }));
      },
    );

  const remove = (preset: PresetSummary) =>
    run(
      () => deletePresetAction(preset.id),
      () => {
        setConfirmingId(null);
        onDeleted(preset.id);
        setStatus(t("deleted", { name: preset.workout.name ?? "" }));
      },
    );

  const load = (preset: PresetSummary, own: boolean) => {
    setConfirmingId(null);
    onLoad(preset, own);
    setStatus(t("loaded", { name: preset.workout.name ?? "" }));
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "mine", label: t("mine"), count: lists?.mine.length ?? 0 },
    { key: "library", label: t("library"), count: lists?.library.length ?? 0 },
  ];
  // Arrow keys move between tabs, as the ARIA tabs pattern expects.
  const onTabKey = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const next: Tab = tab === "mine" ? "library" : "mine";
    setTab(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  const presets = lists ? lists[tab] : [];

  return (
    <section
      aria-labelledby={`${baseId}-title`}
      className="flex flex-col gap-4 rounded-2xl border border-coach-line p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${baseId}-title`} className="text-lg font-bold">
          {t("title")}
        </h2>
        <div role="tablist" aria-label={t("title")} className="flex gap-1">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              id={`${baseId}-tab-${key}`}
              type="button"
              role="tab"
              aria-selected={tab === key}
              aria-controls={`${baseId}-panel`}
              tabIndex={tab === key ? 0 : -1}
              onKeyDown={onTabKey}
              onClick={() => setTab(key)}
              className="min-h-10 rounded-lg border border-coach-line px-3 text-sm font-semibold text-coach-muted hover:bg-coach-surface aria-selected:border-coach-fg aria-selected:bg-coach-fg aria-selected:text-coach-bg"
            >
              {label} <span className="tabular-nums">({count})</span>
            </button>
          ))}
        </div>
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${tab}`}
      >
        {!lists ? (
          <p className="text-coach-muted">{t("loadFailed")}</p>
        ) : presets.length === 0 ? (
          <p className="text-coach-muted">
            {tab === "mine" ? t("emptyMine") : t("emptyLibrary")}
          </p>
        ) : (
          <ul className="grid max-h-72 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                own={tab === "mine"}
                editing={preset.id === editingId}
                confirming={preset.id === confirmingId}
                disabled={pending}
                sending={preset.id === sendingId}
                onSend={() => send(preset)}
                onLoad={() => load(preset, tab === "mine")}
                onDuplicate={() => duplicate(preset)}
                onAskDelete={() => setConfirmingId(preset.id)}
                onCancelDelete={() => setConfirmingId(null)}
                onDelete={() => remove(preset)}
              />
            ))}
          </ul>
        )}
      </div>

      <p aria-live="polite" className="min-h-5 text-sm text-coach-muted">
        {status}
      </p>
    </section>
  );
}

const smallButton =
  "min-h-10 rounded-lg border border-coach-line px-3 text-sm font-semibold hover:bg-coach-bg disabled:opacity-60";

function PresetCard({
  preset,
  own,
  editing,
  confirming,
  disabled,
  sending,
  onSend,
  onLoad,
  onDuplicate,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  preset: PresetSummary;
  own: boolean;
  editing: boolean;
  confirming: boolean;
  disabled: boolean;
  sending: boolean;
  onSend: () => void;
  onLoad: () => void;
  onDuplicate: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Presets");
  const tb = useTranslations("Builder");
  const modeLabel = useModeLabel(preset.workout);
  const name = preset.workout.name ?? modeLabel;

  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border bg-coach-surface p-4 ${
        editing ? "border-coach-fg ring-2 ring-coach-fg" : "border-coach-line"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-bold" title={name}>
          {name}
        </p>
        <p className="text-sm text-coach-muted">{modeLabel}</p>
        {!own && (
          <p className="truncate text-sm text-coach-muted">
            {t("by", { name: preset.ownerName })}
          </p>
        )}
      </div>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{t("confirmDelete")}</span>
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            className="min-h-10 rounded-lg bg-red-700 px-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {t("delete")}
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className={smallButton}
          >
            {t("cancel")}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onSend}
            disabled={disabled}
            aria-label={`${tb("send")}: ${name}`}
            className="min-h-10 rounded-lg bg-coach-fg px-3 text-sm font-bold text-coach-bg hover:opacity-90 disabled:opacity-60"
          >
            {sending ? tb("sending") : tb("send")}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onLoad}
              disabled={disabled}
              aria-label={`${own ? t("edit") : t("use")}: ${name}`}
              className={smallButton}
            >
              {own ? t("edit") : t("use")}
            </button>
            {own ? (
              <button
                type="button"
                onClick={onAskDelete}
                disabled={disabled}
                aria-label={`${t("delete")}: ${name}`}
                className={smallButton}
              >
                {t("delete")}
              </button>
            ) : (
              <button
                type="button"
                onClick={onDuplicate}
                disabled={disabled}
                aria-label={`${t("duplicate")}: ${name}`}
                className={smallButton}
              >
                {t("duplicate")}
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
