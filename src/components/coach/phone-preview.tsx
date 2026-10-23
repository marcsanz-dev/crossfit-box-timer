"use client";

import { useMemo } from "react";
import { RunningView } from "@/components/timer/running-view";
import { getDisplayState } from "@/lib/timer/display";
import type { Workout } from "@/lib/timer/schema";
import { buildTimeline } from "@/lib/timer/timeline";

/**
 * The real phone screen, scaled down: it renders the same RunningView the phone
 * uses, at the first second of work. The view sizes itself with container query
 * units, so it fits this frame as it fits any phone.
 */
export function PhonePreview({
  workout,
  stale,
}: {
  workout: Workout;
  stale: boolean;
}) {
  const display = useMemo(() => {
    const timeline = buildTimeline(workout);
    return getDisplayState(timeline, timeline.workStartMs);
  }, [workout]);

  return (
    <div
      aria-hidden="true"
      className={`aspect-[19.5/9] w-full overflow-hidden rounded-[1.75rem] border-[6px] border-stone-800 bg-phone-bg text-phone-fg shadow-xl transition-opacity ${stale ? "opacity-40" : ""}`}
    >
      <RunningView workout={workout} display={display} status="running" />
    </div>
  );
}
