"use client";

import { useState } from "react";
import type { PresetLists } from "@/db/presets";
import { formStateFromWorkout } from "@/lib/coach/workout-form";
import { PresetPanel, type EditingPreset } from "./preset-panel";
import { useWorkoutForm } from "./use-workout-form";
import { WorkoutBuilder } from "./workout-builder";

/** The coach's page: saved workouts on top, the builder below, sharing one form. */
export function CoachWorkspace({ presets }: { presets: PresetLists | null }) {
  const editor = useWorkoutForm();
  const [editing, setEditing] = useState<EditingPreset | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <PresetPanel
        lists={presets}
        editingId={editing?.id ?? null}
        onLoad={(preset, own) => {
          editor.replace(formStateFromWorkout(preset.workout));
          // A colleague's preset loads as a new, unsaved workout.
          setEditing(
            own ? { id: preset.id, name: preset.workout.name ?? "" } : null,
          );
        }}
        onDeleted={(id) => {
          if (editing?.id === id) setEditing(null);
        }}
      />
      <WorkoutBuilder
        editor={editor}
        editing={editing}
        onEditingChange={setEditing}
      />
    </div>
  );
}
