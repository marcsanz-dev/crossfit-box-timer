/** Chromium's install event; not in the TypeScript DOM types. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// Listen as soon as this module loads: Chrome may fire the event before React
// has hydrated the page that wants to show an "Install" button.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Keep Chrome's own mini-infobar away; the page offers its own button.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True when the browser lets the page show its own install prompt (Chrome, Edge, Samsung Internet). */
export function canPromptInstall(): boolean {
  return deferred !== null;
}

/** Shows the browser's install dialog. Must be called inside a user gesture. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (!event) return;
  // The event can only be used once.
  deferred = null;
  notify();
  await event.prompt().catch(() => undefined);
}
