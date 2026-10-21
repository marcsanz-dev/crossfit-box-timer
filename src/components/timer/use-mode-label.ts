import { useTranslations } from "next-intl";
import { formatClock, formatMinutes } from "@/lib/timer/format";
import type { Workout } from "@/lib/timer/schema";

/** "FOR TIME · CAP 10:00", "AMRAP 12", "EMOM · 10 × 1:00". Works in server and client components. */
export function useModeLabel(workout: Workout): string {
  const t = useTranslations("Mode");
  switch (workout.mode) {
    case "forTime":
      return t("forTime", { cap: formatClock(workout.capSeconds) });
    case "amrap":
      return t("amrap", { duration: formatMinutes(workout.durationSeconds) });
    case "emom":
      return t("emom", {
        rounds: workout.rounds,
        interval: formatClock(workout.intervalSeconds),
      });
  }
}
