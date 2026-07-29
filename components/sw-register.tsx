"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    (async () => {
      try {
        // Drop any old caching SW that was causing page refresh loops
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.unregister()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        if (cancelled) return;
        await navigator.serviceWorker.register("/sw.js");
      } catch {
        // push enable flow will retry
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
