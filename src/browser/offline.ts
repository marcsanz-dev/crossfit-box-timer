/**
 * Registers the service worker (`public/sw.js`) that lets phone pages reload
 * offline, then asks it to store the current page and the assets it loaded:
 * on a first visit the worker wasn't there yet to see them.
 */
export async function registerOfflineSupport(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  await navigator.serviceWorker.register("/sw.js", {
    scope: "/",
    // Always check for a new worker, never a copy from the HTTP cache.
    updateViaCache: "none",
  });
  const registration = await navigator.serviceWorker.ready;
  const assets = performance
    .getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((name) => new URL(name).origin === location.origin);
  registration.active?.postMessage({
    type: "cache-page",
    page: location.pathname,
    assets,
  });
}
