export type WakeLockStatus = "idle" | "active" | "unsupported" | "failed";

/**
 * Keeps the screen on with the Screen Wake Lock API.
 * - The browser releases the lock whenever the page is hidden (tab switch,
 *   screen off, incoming call), so it is re-acquired when the page is visible again.
 * - Power-saving modes may deny or drop it; the status lets the UI warn.
 */
export class ScreenWakeLock {
  #sentinel: WakeLockSentinel | null = null;
  #wanted = false;
  #status: WakeLockStatus = "idle";
  readonly #listeners = new Set<() => void>();

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && "wakeLock" in navigator;
  }

  get status(): WakeLockStatus {
    return this.#status;
  }

  /** Call from the Start tap: Safari used to require a user gesture. */
  async acquire(): Promise<void> {
    this.#wanted = true;
    document.addEventListener("visibilitychange", this.#onVisibilityChange);
    if (!ScreenWakeLock.isSupported()) return this.#setStatus("unsupported");
    if (this.#sentinel || document.visibilityState !== "visible") return;
    try {
      const sentinel = await navigator.wakeLock.request("screen");
      sentinel.addEventListener("release", () => {
        if (this.#sentinel === sentinel) this.#sentinel = null;
        if (this.#wanted) this.#setStatus("idle");
      });
      this.#sentinel = sentinel;
      this.#setStatus("active");
    } catch {
      this.#setStatus("failed");
    }
  }

  async release(): Promise<void> {
    this.#wanted = false;
    document.removeEventListener("visibilitychange", this.#onVisibilityChange);
    const sentinel = this.#sentinel;
    this.#sentinel = null;
    this.#setStatus("idle");
    await sentinel?.release().catch(() => undefined);
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  readonly #onVisibilityChange = () => {
    if (this.#wanted && document.visibilityState === "visible") {
      void this.acquire();
    }
  };

  #setStatus(status: WakeLockStatus): void {
    if (this.#status === status) return;
    this.#status = status;
    for (const listener of this.#listeners) listener();
  }
}
