import { SOUNDS } from "@/lib/audio/sounds";
import type { CueKind } from "@/lib/timer/timeline";

const ATTACK_S = 0.005;
const RELEASE_S = 0.03;
const PEAK_GAIN = 0.6;
/** Upper bound for output-latency compensation (Bluetooth is usually 0.1–0.3 s). */
const MAX_LATENCY_S = 0.5;
/**
 * A near-inaudible low tone that keeps the output alive:
 * - Chrome switches to a fake audio sink after 30 s of pure digital silence;
 * - many Bluetooth speakers fall asleep and clip the next beep.
 * 40 Hz at -54 dB is below what phone speakers reproduce.
 */
const KEEP_ALIVE = { frequency: 40, gain: 0.002 } as const;

/**
 * Plays the timer cues with the Web Audio API. Tones are synthesized and
 * scheduled on the audio clock, so their timing does not depend on the main thread.
 */
export class CuePlayer {
  #ctx: AudioContext | null = null;
  #output: AudioNode | null = null;
  readonly #active = new Set<OscillatorNode>();
  readonly #listeners = new Set<() => void>();

  get state(): AudioContextState | "uninitialized" {
    return this.#ctx?.state ?? "uninitialized";
  }

  /**
   * Must be called synchronously inside a user gesture (the Start tap):
   * browsers only let audio start from one.
   */
  unlock(): Promise<boolean> {
    // iOS: "playback" keeps beeps audible when the Silent switch is on.
    const session = navigator.audioSession;
    if (session && session.type !== "playback") {
      try {
        session.type = "playback";
      } catch {
        // Older Safari versions expose the API read-only; ignore.
      }
    }
    if (!this.#ctx) {
      try {
        this.#createGraph();
      } catch {
        // No Web Audio at all: the timer must still run, silently.
        return Promise.resolve(false);
      }
    }
    return this.resume();
  }

  /** Resumes after an interruption; resolves `false` if a new tap is needed. */
  async resume(): Promise<boolean> {
    const ctx = this.#ctx;
    if (!ctx) return false;
    if (ctx.state === "running") return true;
    try {
      await ctx.resume();
    } catch {
      return false;
    }
    return this.state === "running";
  }

  /** Schedules a cue `delayMs` from now, compensating the output latency. */
  play(kind: CueKind, delayMs: number): void {
    const ctx = this.#ctx;
    const output = this.#output;
    if (!ctx || !output || ctx.state !== "running") return;

    const latency = Math.min(
      MAX_LATENCY_S,
      ctx.outputLatency || ctx.baseLatency || 0,
    );
    const base = Math.max(
      ctx.currentTime,
      ctx.currentTime + delayMs / 1000 - latency,
    );

    for (const tone of SOUNDS[kind]) {
      const start = base + tone.offsetMs / 1000;
      const end = start + tone.durationMs / 1000;
      const peak = PEAK_GAIN / tone.frequencies.length;
      for (const frequency of tone.frequencies) {
        const osc = new OscillatorNode(ctx, { type: tone.type, frequency });
        const gain = new GainNode(ctx, { gain: 0 });
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(peak, start + ATTACK_S);
        gain.gain.setValueAtTime(peak, end - RELEASE_S);
        gain.gain.linearRampToValueAtTime(0, end);
        osc.connect(gain).connect(output);
        osc.onended = () => {
          gain.disconnect();
          this.#active.delete(osc);
        };
        this.#active.add(osc);
        osc.start(start);
        osc.stop(end);
      }
    }
  }

  /** Cancels every cue scheduled but not played yet (pause, stop, restart). */
  cancelAll(): void {
    for (const osc of this.#active) {
      try {
        osc.stop();
      } catch {
        // Already stopped.
      }
    }
    this.#active.clear();
  }

  /** Notified whenever the audio context changes state (suspended, interrupted…). */
  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  dispose(): void {
    this.cancelAll();
    this.#listeners.clear();
    void this.#ctx?.close();
    this.#ctx = null;
    this.#output = null;
  }

  #createGraph(): void {
    const ctx = new AudioContext({ latencyHint: "interactive" });
    // The compressor makes beeps louder without clipping when chords overlap.
    const compressor = new DynamicsCompressorNode(ctx, {
      threshold: -12,
      ratio: 8,
    });
    compressor.connect(ctx.destination);

    const keepAlive = new OscillatorNode(ctx, {
      type: "sine",
      frequency: KEEP_ALIVE.frequency,
    });
    keepAlive
      .connect(new GainNode(ctx, { gain: KEEP_ALIVE.gain }))
      .connect(ctx.destination);
    keepAlive.start();

    ctx.onstatechange = () => {
      for (const listener of this.#listeners) listener();
    };
    this.#ctx = ctx;
    this.#output = compressor;
  }
}
