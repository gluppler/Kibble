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
    // Only register in production and if service workers are supported
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Only log in development
          if (process.env.NODE_ENV === "development") {
            // Service Worker registered successfully
          }
        })
        .catch((error) => {
          // Only log in development
          if (process.env.NODE_ENV === "development") {
            // Service Worker registration failed (silent in production)
          }
        });
    }
  }, []);

  return null;
}
