/**
 * Layout Context Module
 * 
 * Provides layout management (Kanban, Table, Grid, List) for kanban boards using React Context.
 * Persists layout preference in localStorage.
 */

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * Layout type - different view modes for kanban boards
 */
export type LayoutType = "kanban" | "table" | "grid" | "list";

/**
 * Layout context type definition
 */
interface LayoutContextType {
  layout: LayoutType;
  setLayout: (layout: LayoutType) => void;
}

/**
 * Layout context instance
 * Used to provide layout state and setter function to child components
 */
const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

/**
 * localStorage key for persisting layout preference
 */
const LAYOUT_STORAGE_KEY = "kibble_layout_preference";

/**
 * LayoutProvider component
 * 
 * Manages layout state and provides it to all child components via Context.
 * 
 * Features:
 * - Persists layout preference in localStorage
 * - Defaults to "kanban" layout
 * - Prevents hydration mismatch by waiting for mount
 * 
 * @param children - React children components
 */
export function LayoutProvider({ children }: { children: ReactNode }) {
  const [layout, setLayoutState] = useState<LayoutType>("kanban");
  const [mounted, setMounted] = useState(false);

  /**
   * Initialize layout on component mount
   * 
   * Priority:
   * 1. Saved layout from localStorage
   * 2. Default to "kanban"
   */
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedLayout = localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutType | null;
      const initialLayout = savedLayout && ["kanban", "table", "grid", "list"].includes(savedLayout)
        ? savedLayout
        : "kanban";
      setLayoutState(initialLayout);
    }
  }, []);

  /**
   * Sets the layout and persists to localStorage
   * 
   * @param newLayout - The layout to set
   */
  const setLayout = (newLayout: LayoutType) => {
    setLayoutState(newLayout);
    if (typeof window !== "undefined") {
      localStorage.setItem(LAYOUT_STORAGE_KEY, newLayout);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

/**
 * Hook to access layout context
 * 
 * @returns Layout context with current layout and setter function
 * @throws Error if used outside LayoutProvider
 */
export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
