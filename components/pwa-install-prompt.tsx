/**
 * PWA Install Prompt Component
 * 
 * Handles the "Add to Home Screen" prompt for Progressive Web Apps.
 * Shows a custom install button when the browser's install prompt is available.
 * 
 * Features:
 * - Detects when app can be installed
 * - Shows custom install button
 * - Handles install flow
 * - Tracks install state
 * - Works on Android Chrome, Edge, and other Chromium-based browsers
 * - iOS Safari shows native "Add to Home Screen" instructions
 */

"use client";

import { useState, useEffect } from "react";
import { logError } from "@/lib/logger";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(isStandaloneMode);

    // Check if iOS
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    setIsIOS(iOS);

    // If already installed or iOS, don't show prompt
    if (isStandaloneMode || iOS) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt before (stored in localStorage)
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem("pwa-install-dismissed");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user response
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
        setShowPrompt(false);
      } else {
        // User dismissed, remember for 7 days
        localStorage.setItem("pwa-install-dismissed", Date.now().toString());
      }

      setDeferredPrompt(null);
    } catch (error) {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        logError("Error showing install prompt:", error);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone || !showPrompt) {
    return null;
  }

  // iOS Safari - show custom instructions
  if (isIOS) {
    return (
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg shadow-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                <Smartphone className="text-white dark:text-black" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-black dark:text-white text-sm mb-1">
                  Install Kibble
                </h3>
                <p className="text-xs text-black/60 dark:text-white/60 font-bold mb-2">
                  Tap the share button <span className="font-bold">→</span> "Add to Home Screen"
                </p>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white font-bold underline"
                  type="button"
                >
                  Dismiss
                </button>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
                aria-label="Close"
                type="button"
              >
                <X className="text-black dark:text-white" size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Android/Chrome - show install button
  return (
    <AnimatePresence>
      {showPrompt && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg shadow-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
              <Download className="text-white dark:text-black" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-black dark:text-white text-sm mb-1">
                Install Kibble
              </h3>
              <p className="text-xs text-black/60 dark:text-white/60 font-bold mb-3">
                Add to your home screen for quick access
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstallClick}
                  className="flex-1 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded font-bold text-xs hover:opacity-80 transition-opacity"
                  type="button"
                >
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded font-bold text-xs hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  type="button"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Close"
              type="button"
            >
              <X className="text-black dark:text-white" size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
