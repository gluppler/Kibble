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
 */
export function LayoutSelector() {
  const { layout, setLayout } = useLayout();

  return (
    <div className="flex items-center gap-1 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg p-1">
      {layoutOptions.map((option) => {
        const Icon = option.icon;
        const isActive = layout === option.value;

        return (
          <motion.button
            key={option.value}
            onClick={() => setLayout(option.value)}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              isActive
                ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                : "text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`Switch to ${option.label} view`}
            title={option.description}
            type="button"
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
