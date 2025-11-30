/**
 * Theme Context Module
 * 
 * Provides theme management (light/dark mode) for the application using React Context.
 * Persists theme preference in localStorage and respects system preferences.
 */

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

/**
 * Theme type - either "light" or "dark"
 */
type Theme = "light" | "dark";

/**
 * Theme context type definition
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * Theme context instance
 * Used to provide theme state and toggle function to child components
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider component
 * 
 * Manages theme state and provides it to all child components via Context.
 * 
 * Features:
 * - Persists theme preference in localStorage
 * - Respects system color scheme preference on first load
 * - Applies theme to document root element
 * - Prevents hydration mismatch by waiting for mount
 * 
 * @param children - React children components
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  /**
   * Initialize theme on component mount
   * 
   * Priority:
   * 1. Saved theme from localStorage
   * 2. System preference (prefers-color-scheme)
   * 3. Default to "light"
   */
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    updateTheme(initialTheme);
  }, []);

  /**
   * Updates the theme on the document root element
   * 
   * @param newTheme - The theme to apply ("light" or "dark")
   */
  const updateTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    
    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      // Remove existing theme classes
      root.classList.remove("light", "dark");
      // Add new theme class
      root.classList.add(newTheme);
      
      // Also set data attribute for better compatibility with CSS selectors
      root.setAttribute("data-theme", newTheme);
    });
  };

  /**
   * Toggles between light and dark theme
   * 
   * Process:
   * 1. Determines new theme (opposite of current)
   * 2. Updates state
   * 3. Saves to localStorage
   * 4. Applies to document
   */
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    updateTheme(newTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  // This ensures localStorage access only happens on client
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme hook
 * 
 * Provides access to theme context in components.
 * 
 * @returns Theme context with current theme and toggle function
 * @throws Error if used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
