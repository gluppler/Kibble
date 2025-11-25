"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/contexts/theme-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}
