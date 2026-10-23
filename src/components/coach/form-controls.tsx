import type { ReactNode } from "react";

export const inputClass =
  "h-11 w-full rounded-lg border border-coach-line bg-coach-surface px-3 text-base text-coach-fg placeholder:text-coach-muted/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-coach-fg aria-[invalid=true]:border-red-600 dark:aria-[invalid=true]:border-red-400";

/** Label + control + hint/error, wired with ids so screen readers announce both. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-coach-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Minutes + seconds, like a stopwatch. Empty inputs become NaN and fail validation. */
export function DurationInput({
  id,
  label,
  minutes,
  seconds,
  secondsStep = 1,
  error,
  minutesLabel,
  secondsLabel,
  onChange,
}: {
  id: string;
  label: string;
  minutes: number;
  seconds: number;
  secondsStep?: number;
  error?: string;
  minutesLabel: string;
  secondsLabel: string;
  onChange: (minutes: number, seconds: number) => void;
}) {
  const describedBy = error ? `${id}-error` : undefined;
  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={describedBy}>
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-coach-muted">
          {minutesLabel}
          <input
            id={`${id}-minutes`}
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            value={Number.isNaN(minutes) ? "" : minutes}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onChange(e.target.valueAsNumber, seconds)}
            className={`${inputClass} tabular-nums`}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-coach-muted">
          {secondsLabel}
          <input
            id={`${id}-seconds`}
            type="number"
            inputMode="numeric"
            min={0}
            max={59}
            step={secondsStep}
            value={Number.isNaN(seconds) ? "" : seconds}
            aria-invalid={error ? true : undefined}
            onChange={(e) => onChange(minutes, e.target.valueAsNumber)}
            className={`${inputClass} tabular-nums`}
          />
        </label>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="text-sm font-medium text-red-700 dark:text-red-400"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
