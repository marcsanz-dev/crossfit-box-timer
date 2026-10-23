import { describe, expect, it } from "vitest";
import { startRun } from "./clock";
import { workoutSchema } from "./schema";
import {
  getStoredShareCode,
  isSessionStale,
  parseSession,
  serializeSession,
  SESSION_STALE_AFTER_MS,
} from "./session";
import { buildTimeline } from "./timeline";

const workout = workoutSchema.parse({ mode: "amrap", durationSeconds: 720 });
const T0 = 1_800_000_000_000;

describe("session persistence", () => {
  it("round-trips a running session", () => {
    const run = startRun(T0);
    const raw = serializeSession("demo-amrap", workout, run);
    expect(parseSession(raw, "demo-amrap")).toEqual({
      version: 1,
      key: "demo-amrap",
      workout,
      run,
    });
  });

  it("ignores a session saved for another workout", () => {
    const raw = serializeSession("demo-amrap", workout, startRun(T0));
    expect(parseSession(raw, "ABC123")).toBeNull();
  });

  it.each([
    ["nothing stored", null],
    ["invalid JSON", "{not json"],
    ["an unknown version", JSON.stringify({ version: 2 })],
    [
      "a tampered workout",
      JSON.stringify({
        version: 1,
        key: "k",
        workout: { mode: "amrap", durationSeconds: -1 },
        run: startRun(T0),
      }),
    ],
  ])("returns null for %s", (_label, raw) => {
    expect(parseSession(raw, "k")).toBeNull();
  });
});

describe("getStoredShareCode", () => {
  it("returns the code of a stored shared workout", () => {
    const raw = serializeSession("share:K7QM4P", workout, startRun(T0));
    expect(getStoredShareCode(raw)).toBe("K7QM4P");
  });

  it.each([
    ["a demo run", serializeSession("demo:amrap", workout, startRun(T0))],
    ["nothing stored", null],
    ["invalid JSON", "{nope"],
    ["an invalid session", JSON.stringify({ version: 1, key: "share:K7QM4P" })],
  ])("returns null for %s", (_label, raw) => {
    expect(getStoredShareCode(raw)).toBeNull();
  });
});

describe("isSessionStale", () => {
  const timeline = buildTimeline(workout);

  it("keeps a session until 30 minutes after the workout ends", () => {
    const run = startRun(T0);
    const endsAt = T0 + timeline.totalMs;
    expect(isSessionStale(run, timeline, endsAt + SESSION_STALE_AFTER_MS)).toBe(
      false,
    );
    expect(
      isSessionStale(run, timeline, endsAt + SESSION_STALE_AFTER_MS + 1),
    ).toBe(true);
  });
});
