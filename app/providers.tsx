/**
 * Providers Component
 * 
 * Wraps the application with all necessary context providers.
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/theme-context";
import { AlertProvider } from "@/contexts/alert-context";
import { LayoutProvider } from "@/contexts/layout-context";
import { RegisterServiceWorker } from "@/app/register-sw";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { OrientationHandler } from "@/components/orientation-handler";
import { ReactNode } from "react";

/**
 * Providers component
 * 
 * Provides session, theme, alert, and layout context to all child components.
 * Also registers service worker and shows PWA install prompt.
 * 
 * @param children - React children components
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AlertProvider>
          <LayoutProvider>
            <RegisterServiceWorker />
            <PWAInstallPrompt />
            <OrientationHandler />
            {children}
          </LayoutProvider>
        </AlertProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
