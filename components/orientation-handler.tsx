/**
 * Orientation Handler Component
 * 
 * Handles device orientation changes and ensures proper layout adjustments.
 * Prevents layout issues when rotating between portrait and landscape.
 * 
 * Features:
 * - Detects orientation changes
 * - Adjusts viewport on rotation
 * - Prevents zoom on orientation change (iOS Safari)
 */

"use client";

import { useEffect } from "react";

export function OrientationHandler() {
  useEffect(() => {
    // Prevent zoom on orientation change (iOS Safari quirk)
    const handleOrientationChange = () => {
      // Force viewport recalculation
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const content = viewport.getAttribute("content") || "";
        viewport.setAttribute("content", content);
      }

      // Small delay to ensure proper recalculation
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    };

    // Listen for orientation changes
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  return null;
}
