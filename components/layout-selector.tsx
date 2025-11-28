/**
 * Layout Selector Component
 * 
 * Provides a UI for switching between different board layout views:
 * - Kanban (default): Traditional column-based view
 * - Table: Spreadsheet-like view with columns as table columns
 * - Grid: Card grid view with all tasks
 * - List: Simple list view with all tasks
 */

"use client";

import { LayoutGrid, Table, List, Columns } from "lucide-react";
import { useLayout, type LayoutType } from "@/contexts/layout-context";
import { motion } from "framer-motion";

/**
 * Layout option configuration
 */
const layoutOptions: Array<{
  value: LayoutType;
  label: string;
  icon: typeof LayoutGrid;
  description: string;
}> = [
  {
    value: "kanban",
    label: "Kanban",
    icon: Columns,
    description: "Column-based view",
  },
  {
    value: "table",
    label: "Table",
    icon: Table,
    description: "Spreadsheet view",
  },
  {
    value: "grid",
    label: "Grid",
    icon: LayoutGrid,
    description: "Card grid view",
  },
  {
    value: "list",
    label: "List",
    icon: List,
    description: "Simple list view",
  },
];

/**
 * LayoutSelector Component
 * 
 * Renders a button group for selecting board layout view.
 * Uses Fitts's Law principles: large, easy-to-click buttons with clear labels.
 * 
 * Mobile Optimizations:
 * - 44x44px touch targets for accessibility (WCAG 2.1 Level AAA)
 * - Consistent icon alignment on single baseline
 * - Locked icon sizes to prevent layout shifts
 * - Proper flex alignment matching desktop
 */
export function LayoutSelector() {
  const { layout, setLayout } = useLayout();

  return (
    <div className="flex items-center justify-center gap-1 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg p-1">
      {layoutOptions.map((option) => {
        const Icon = option.icon;
        const isActive = layout === option.value;

        return (
          <motion.button
            key={option.value}
            onClick={() => setLayout(option.value)}
            className={`relative flex items-center justify-center gap-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${
              isActive
                ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            // Mobile: 44x44px touch target (WCAG 2.1 Level AAA), Desktop: auto padding
            // Visual size remains consistent, only touch target is enlarged
            style={{
              minWidth: '44px',
              minHeight: '44px',
              padding: '0.375rem 0.75rem', // px-3 py-1.5 equivalent
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Switch to ${option.label} view`}
            title={option.description}
            type="button"
          >
            {/* Icon with locked size for consistent baseline alignment */}
            <Icon 
              size={14} 
              className="flex-shrink-0"
              style={{ 
                width: '14px', 
                height: '14px',
                display: 'block',
                flexShrink: 0,
              }}
              aria-hidden="true"
            />
            <span className="hidden sm:inline whitespace-nowrap">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
