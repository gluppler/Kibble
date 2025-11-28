/**
 * Priority Tag Component
 * 
 * Displays a task priority tag (Normal or High Priority) following
 * Kibble's strict black & white aesthetic.
 * 
 * Features:
 * - Theme-aware styling
 * - Minimal design with Inter Bold font
 * - Accessible labels
 * - Consistent sizing across views
 */

"use client";

import { AlertTriangle } from "lucide-react";
import { memo } from "react";

/**
 * Priority type
 */
export type Priority = "normal" | "high";

/**
 * Props for PriorityTag component
 */
interface PriorityTagProps {
  /** Priority level */
  priority: Priority;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * PriorityTag Component
 * 
 * Renders a priority tag with appropriate styling based on priority level.
 * High priority uses stronger visual distinction while maintaining black/white theme.
 */
export const PriorityTag = memo(function PriorityTag({
  priority,
  className = "",
  size = "md",
}: PriorityTagProps) {
  const isHighPriority = priority === "high";
  const sizeClasses = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-bold ${sizeClasses} ${className} ${
        isHighPriority
          ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
          : "bg-white dark:bg-black text-black dark:text-white border-black/20 dark:border-white/20"
      }`}
      aria-label={isHighPriority ? "High Priority" : "Normal Priority"}
    >
      {isHighPriority && (
        <AlertTriangle
          size={size === "sm" ? 10 : 12}
          className="flex-shrink-0"
          aria-hidden="true"
        />
      )}
      <span>{isHighPriority ? "High Priority" : "Normal"}</span>
    </span>
  );
});

PriorityTag.displayName = "PriorityTag";
