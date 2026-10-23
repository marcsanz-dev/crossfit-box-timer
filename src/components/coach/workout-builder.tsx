"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { createShareAction } from "@/app/[locale]/coach/actions";
import { useRouter } from "@/i18n/navigation";
import {
  FORM_LIMITS,
  INITIAL_FORM_STATE,
  toWorkoutInput,
  validateWorkoutForm,
  type FieldErrors,
  type FormErrorCode,
  type FormField,
  type WorkoutFormState,
} from "@/lib/coach/workout-form";
import { formatClock } from "@/lib/timer/format";
import {
  PREP_SECONDS_OPTIONS,
  type Workout,
  type WorkoutMode,
} from "@/lib/timer/schema";
import { DurationInput, Field, inputClass } from "./form-controls";
import { PhonePreview } from "./phone-preview";

const MODES: WorkoutMode[] = ["forTime", "amrap", "emom"];
const MODE_KEYS = {
  forTime: { label: "modeForTime", hint: "modeForTimeHint" },
  amrap: { label: "modeAmrap", hint: "modeAmrapHint" },
  emom: { label: "modeEmom", hint: "modeEmomHint" },
} as const;

/** The coach's workout form, with a live preview of the phone screen. */
export function WorkoutBuilder() {
  const t = useTranslations("Builder");
  const router = useRouter();
  const [form, setForm] = useState<WorkoutFormState>(INITIAL_FORM_STATE);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const validation = useMemo(() => validateWorkoutForm(form), [form]);
  // Keep showing the last valid workout (dimmed) while a field is being corrected.
  const [lastValid, setLastValid] = useState<Workout | null>(() => {
    const initial = validateWorkoutForm(INITIAL_FORM_STATE);
    return initial.ok ? initial.workout : null;
  });
  const preview = validation.ok ? validation.workout : lastValid;

  const update = (patch: Partial<WorkoutFormState>) => {
    const next = { ...form, ...patch };
    const nextValidation = validateWorkoutForm(next);
    if (nextValidation.ok) setLastValid(nextValidation.workout);
    setSubmitError(null);
    setForm(next);
  };
  const errorText = useErrorText();
  const error = (field: FormField) => errorText(field, validation.errors);

  const send = () => {
    if (!validation.ok) {
      setSubmitError(t("errorForm"));
      return;
    }
    startTransition(async () => {
      const result = await createShareAction(toWorkoutInput(form));
      if (result.ok) {
        router.push(`/coach/share/${result.code}`);
      } else {
        setSubmitError(
          t(result.error === "session" ? "errorSession" : "errorServer"),
        );
      }
    });
  };

  const emomTotal =
    form.mode === "emom" && validation.ok && validation.workout.mode === "emom"
      ? formatClock(
          validation.workout.intervalSeconds * validation.workout.rounds,
        )
      : null;

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
    >
      <div className="flex flex-col gap-7">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">
            {t("modeLabel")}
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {MODES.map((mode) => (
              <label
                key={mode}
                className="flex cursor-pointer flex-col gap-1 rounded-xl border border-coach-line bg-coach-surface p-4 transition has-checked:border-coach-fg has-checked:ring-2 has-checked:ring-coach-fg has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-coach-fg"
              >
                <input
                  type="radio"
                  name="mode"
                  value={mode}
                  checked={form.mode === mode}
                  onChange={() => update({ mode })}
                  className="sr-only"
                />
                <span className="text-lg font-black">
                  {t(MODE_KEYS[mode].label)}
                </span>
                <span className="text-sm leading-snug text-coach-muted">
                  {t(MODE_KEYS[mode].hint)}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {form.mode === "forTime" && (
          <DurationInput
            id="cap"
            label={t("cap")}
            minutes={form.capMinutes}
            seconds={form.capSeconds}
            minutesLabel={t("minutes")}
            secondsLabel={t("seconds")}
            error={error("cap")}
            onChange={(capMinutes, capSeconds) =>
              update({ capMinutes, capSeconds })
            }
          />
        )}
        {form.mode === "amrap" && (
          <DurationInput
            id="duration"
            label={t("duration")}
            minutes={form.durationMinutes}
            seconds={form.durationSeconds}
            minutesLabel={t("minutes")}
            secondsLabel={t("seconds")}
            error={error("duration")}
            onChange={(durationMinutes, durationSeconds) =>
              update({ durationMinutes, durationSeconds })
            }
          />
        )}
        {form.mode === "emom" && (
          <>
            <div className="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <DurationInput
                id="interval"
                label={t("interval")}
                minutes={form.intervalMinutes}
                seconds={form.intervalSeconds}
                secondsStep={FORM_LIMITS.intervalStepSeconds}
                minutesLabel={t("minutes")}
                secondsLabel={t("seconds")}
                error={error("interval")}
                onChange={(intervalMinutes, intervalSeconds) =>
                  update({ intervalMinutes, intervalSeconds })
                }
              />
              <Field id="rounds" label={t("rounds")} error={error("rounds")}>
                <input
                  id="rounds"
                  type="number"
                  inputMode="numeric"
                  min={FORM_LIMITS.minRounds}
                  max={FORM_LIMITS.maxRounds}
                  value={Number.isNaN(form.rounds) ? "" : form.rounds}
                  aria-invalid={error("rounds") ? true : undefined}
                  aria-describedby={
                    error("rounds") ? "rounds-error" : undefined
                  }
                  onChange={(e) => update({ rounds: e.target.valueAsNumber })}
                  className={`${inputClass} mt-auto tabular-nums`}
                />
              </Field>
            </div>
            {emomTotal && (
              <p className="-mt-4 text-sm text-coach-muted">
                {t("totalEmom", { total: emomTotal })}
              </p>
            )}
            <StationsInput
              stations={form.stations}
              error={error("stations")}
              onChange={(stations) => update({ stations })}
            />
          </>
        )}

        <Field id="name" label={t("name")} error={error("name")}>
          <input
            id="name"
            type="text"
            maxLength={FORM_LIMITS.nameMaxLength}
            placeholder={t("namePlaceholder")}
            value={form.name}
            aria-invalid={error("name") ? true : undefined}
            onChange={(e) => update({ name: e.target.value })}
            className={inputClass}
          />
        </Field>

        <Field
          id="description"
          label={t("description")}
          error={error("description")}
        >
          <textarea
            id="description"
            rows={4}
            maxLength={FORM_LIMITS.descriptionMaxLength}
            placeholder={t("descriptionPlaceholder")}
            value={form.description}
            aria-invalid={error("description") ? true : undefined}
            onChange={(e) => update({ description: e.target.value })}
            className={`${inputClass} h-auto py-2 leading-snug`}
          />
        </Field>

        <Field id="prep" label={t("prep")} error={error("prepSeconds")}>
          <select
            id="prep"
            value={form.prepSeconds}
            onChange={(e) => update({ prepSeconds: Number(e.target.value) })}
            className={inputClass}
          >
            {PREP_SECONDS_OPTIONS.map((seconds) => (
              <option key={seconds} value={seconds}>
                {seconds === 0 ? t("prepNone") : t("prepSeconds", { seconds })}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-5 lg:sticky lg:top-8 lg:self-start">
        <h2 className="text-sm font-semibold">{t("preview")}</h2>
        {preview && <PhonePreview workout={preview} stale={!validation.ok} />}
        <button
          type="submit"
          disabled={pending}
          className="min-h-14 rounded-xl bg-coach-fg px-6 text-lg font-bold text-coach-bg transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? t("sending") : t("send")}
        </button>
        <p
          aria-live="polite"
          className="min-h-6 text-sm font-medium text-red-700 dark:text-red-400"
        >
          {submitError}
        </p>
      </div>
    </form>
  );
}

function StationsInput({
  stations,
  error,
  onChange,
}: {
  stations: string[];
  error?: string;
  onChange: (stations: string[]) => void;
}) {
  const t = useTranslations("Builder");
  const canAdd = stations.length < FORM_LIMITS.maxStations;

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby="stations-hint">
      <legend className="mb-1 text-sm font-semibold">{t("stations")}</legend>
      <p id="stations-hint" className="text-sm text-coach-muted">
        {t("stationsHint")}
      </p>
      <ol className="flex flex-col gap-2">
        {stations.map((station, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-6 text-right text-sm text-coach-muted tabular-nums">
              {index + 1}.
            </span>
            <input
              type="text"
              aria-label={t("stationLabel", { number: index + 1 })}
              maxLength={FORM_LIMITS.stationMaxLength}
              placeholder={index === 0 ? t("stationPlaceholder") : undefined}
              value={station}
              aria-invalid={error ? true : undefined}
              onChange={(e) =>
                onChange(
                  stations.map((s, i) => (i === index ? e.target.value : s)),
                )
              }
              className={inputClass}
            />
            {stations.length > 1 && (
              <button
                type="button"
                aria-label={t("removeStation", { number: index + 1 })}
                onClick={() => onChange(stations.filter((_, i) => i !== index))}
                className="grid size-11 shrink-0 place-items-center rounded-lg border border-coach-line text-xl leading-none hover:bg-coach-surface"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ol>
      {canAdd && (
        <button
          type="button"
          onClick={() => onChange([...stations, ""])}
          className="self-start rounded-lg px-2 py-1 text-sm font-semibold underline-offset-4 hover:underline"
        >
          + {t("addStation")}
        </button>
      )}
      {error && (
        <p className="text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** Message for a field's error code, with the limits interpolated. */
function useErrorText() {
  const t = useTranslations("Builder.errors");
  // One explicit call per code, so the typed messages check every parameter.
  const message = (code: FormErrorCode): string => {
    switch (code) {
      case "workRange":
        return t(code, {
          min: FORM_LIMITS.minWorkMinutes,
          max: FORM_LIMITS.maxWorkMinutes,
        });
      case "intervalRange":
        return t(code, {
          min: FORM_LIMITS.minIntervalSeconds,
          max: FORM_LIMITS.maxIntervalMinutes,
        });
      case "intervalStep":
        return t(code, { step: FORM_LIMITS.intervalStepSeconds });
      case "roundsRange":
        return t(code, {
          min: FORM_LIMITS.minRounds,
          max: FORM_LIMITS.maxRounds,
        });
      case "totalTooLong":
        return t(code, { max: FORM_LIMITS.maxWorkMinutes });
      case "tooManyStations":
        return t(code, { max: FORM_LIMITS.maxStations });
      case "tooLong":
      case "invalid":
        return t(code);
    }
  };
  return (field: FormField, errors: FieldErrors): string | undefined => {
    const code = errors[field];
    return code ? message(code) : undefined;
  };
}
