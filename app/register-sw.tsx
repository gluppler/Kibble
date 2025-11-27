/**
 * Service Worker Registration
 * 
 * Registers the service worker for PWA functionality.
 * Only runs in the browser (client-side).
 */

"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // In development, unregister any existing service workers to prevent interference
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {
            // Ignore unregistration errors
          });
        });
      });
      return;
    }

    // Only register in production
    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);
        })
        .catch(() => {
          // Silently fail in production
        });
    }
  }, []);

  return null;
}
