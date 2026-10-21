/** iPhone, iPod or iPad, including iPadOS reporting itself as a Mac. */
export function isIOS(): boolean {
  const { userAgent, maxTouchPoints } = navigator;
  return (
    /iPhone|iPad|iPod/.test(userAgent) ||
    (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
  );
}

/** Running as a Home Screen web app rather than in a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // Older iOS versions only expose this non-standard flag.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Enters element fullscreen where supported (Android, desktop). iPhone has no
 * element fullscreen, so there we rely on the Home Screen web app instead.
 * Must be called inside a user gesture.
 */
export function enterFullscreen(): void {
  const root = document.documentElement;
  if (!document.fullscreenEnabled || document.fullscreenElement) return;
  root.requestFullscreen?.({ navigationUI: "hide" }).catch(() => undefined);
}

export function exitFullscreen(): void {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined);
  }
}
