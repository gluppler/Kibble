/**
 * Search Bar Component
 * 
 * Provides a minimal, clean search interface with optional filter chips.
 * Follows Kibble's strict black & white aesthetic with Inter font family.
 * 
 * Features:
 * - Real-time search with debouncing
 * - Optional filter chips (Tasks, Boards, Archived)
 * - Theme-aware styling
 * - Mobile-responsive
 * - Accessibility support
 */

"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Filter type for search results
 */
export type SearchFilter = "all" | "tasks" | "boards" | "archived" | "high-priority" | "normal-priority";

/**
 * Props for SearchBar component
 */
interface SearchBarProps {
  /** Current search query */
  searchQuery: string;
  /** Callback when search query changes */
  onSearchChange: (query: string) => void;
  /** Current active filter */
  activeFilter?: SearchFilter;
  /** Callback when filter changes */
  onFilterChange?: (filter: SearchFilter) => void;
  /** Whether to show filter chips */
  showFilters?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SearchBar Component
 * 
 * Renders a minimal search bar with optional filter chips.
 * Uses debouncing to optimize search performance.
 */
export const SearchBar = memo(function SearchBar({
  searchQuery,
  onSearchChange,
  activeFilter = "all",
  onFilterChange,
  showFilters = true,
  placeholder = "Search tasks or classes…",
  className = "",
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  /**
   * Sync local query with external query changes (only when prop changes externally, not from user input)
   * This prevents the input from being overwritten while the user is typing
   * Using a ref to track if the change came from user input
   */
  const isUserInputRef = useRef(false);
  
  useEffect(() => {
    // Only sync if the external query is different from local AND it wasn't from user input
    if (searchQuery !== localQuery && !isUserInputRef.current) {
      setLocalQuery(searchQuery);
    }
    // Reset the flag after sync
    isUserInputRef.current = false;
  }, [searchQuery, localQuery]);

  /**
   * Handle input change - update immediately for real-time filtering
   * This ensures the search results update as the user types without any delay
   */
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    isUserInputRef.current = true; // Mark as user input to prevent sync overwrite
    setLocalQuery(newValue);
    // Update parent immediately for real-time search (no debouncing)
    // This is critical for instant feedback in the sidebar
    onSearchChange(newValue);
  }, [onSearchChange]);

  /**
   * Clear search query
   */
  const handleClear = useCallback(() => {
    const emptyValue = "";
    setLocalQuery(emptyValue);
    onSearchChange(emptyValue);
  }, [onSearchChange]);

  /**
   * Filter chip options
   * Only show relevant filters based on context
   * Normalizes placeholder once to avoid redundant toLowerCase() calls
   */
  const filterOptions: Array<{ value: SearchFilter; label: string }> = useMemo(
    () => {
      // Normalize placeholder once for all checks
      const normalizedPlaceholder = placeholder?.toLowerCase() || "";
      
      // For board search (main page sidebar), only show "All" and "Boards"
      if (normalizedPlaceholder.includes("board") && !normalizedPlaceholder.includes("archived") && !normalizedPlaceholder.includes("task")) {
        return [
          { value: "all", label: "All" },
          { value: "boards", label: "Boards" },
        ];
      }
      // For archive page, only show priority filters (no "Tasks" or "Boards" since there are already tabs for those)
      if (normalizedPlaceholder.includes("archived")) {
        return [
          { value: "all", label: "All" },
          { value: "high-priority", label: "High Priority" },
          { value: "normal-priority", label: "Normal Priority" },
        ];
      }
      // For task search on main board page (single board view), only show priority filters
      // No "Tasks" or "Boards" since we're only viewing one board's tasks
      if (normalizedPlaceholder.includes("task") && !normalizedPlaceholder.includes("archived")) {
        return [
          { value: "all", label: "All" },
          { value: "high-priority", label: "High Priority" },
          { value: "normal-priority", label: "Normal Priority" },
        ];
      }
      // Default fallback (shouldn't reach here, but just in case)
      return [
        { value: "all", label: "All" },
        { value: "high-priority", label: "High Priority" },
        { value: "normal-priority", label: "Normal Priority" },
      ];
    },
    [placeholder]
  );

  return (
    <div className={`w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search
            size={16}
            className="text-black/40 dark:text-white/40"
            aria-hidden="true"
          />
        </div>
        <input
          type="text"
          value={localQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-lg border border-black/20 dark:border-white/20 bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-sm sm:text-base font-normal transition-all"
          aria-label="Search"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            aria-label="Clear search"
            type="button"
          >
            <X size={14} className="text-black dark:text-white" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      {showFilters && onFilterChange && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange(option.value)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                activeFilter === option.value
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                  : "bg-transparent text-black dark:text-white border-black/20 dark:border-white/20 hover:border-black dark:hover:border-white"
              }`}
              type="button"
              aria-label={`Filter by ${option.label}`}
              aria-pressed={activeFilter === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";
