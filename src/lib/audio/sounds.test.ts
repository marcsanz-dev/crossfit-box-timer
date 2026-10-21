import { describe, expect, it } from "vitest";
import { SOUNDS } from "./sounds";

describe("cue sounds", () => {
  it("defines every cue kind", () => {
    expect(Object.keys(SOUNDS).sort()).toEqual(
      ["countdown", "finish", "start", "warning"].sort(),
    );
  });

  it("keeps the 3-2-1 short, so beeps one second apart never overlap", () => {
    const end = Math.max(
      ...SOUNDS.countdown.map((tone) => tone.offsetMs + tone.durationMs),
    );
    expect(end).toBeLessThan(500);
  });

  it("makes the start and the finish clearly longer than the countdown", () => {
    const length = (kind: keyof typeof SOUNDS) =>
      Math.max(...SOUNDS[kind].map((tone) => tone.offsetMs + tone.durationMs));
    expect(length("start")).toBeGreaterThan(3 * length("countdown"));
    expect(length("finish")).toBeGreaterThan(length("start"));
  });

  it("uses audible frequencies", () => {
    for (const tones of Object.values(SOUNDS)) {
      for (const tone of tones) {
        for (const frequency of tone.frequencies) {
          expect(frequency).toBeGreaterThanOrEqual(200);
          expect(frequency).toBeLessThanOrEqual(4000);
        }
      }
    }
  });
});
