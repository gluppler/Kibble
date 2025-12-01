/**
 * Loading Spinner Component
 * 
 * Reusable loading spinner with consistent styling and animations.
 * Used across the application for consistent UI/UX.
 * 
 * Features:
 * - Responsive sizing (mobile and desktop)
 * - Dark mode support
 * - Smooth fade-in animation
 * - Customizable text message
 */

"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  /**
   * Loading message to display below the spinner
   */
  message?: string;
  /**
   * Size of the spinner
   * @default "default" - 10x10 on mobile, 12x12 on desktop
   */
  size?: "small" | "default" | "large";
  /**
   * Whether to show full screen layout
   * @default true
   */
  fullScreen?: boolean;
  /**
   * Additional className for custom styling
   */
  className?: string;
}

/**
 * LoadingSpinner Component
 * 
 * Displays a centered loading spinner with optional message.
 * Includes smooth fade-in animation for better UX.
 */
export const LoadingSpinner = memo(function LoadingSpinner({
  message,
  size = "default",
  fullScreen = true,
  className = "",
}: LoadingSpinnerProps) {
  // Size classes based on size prop (memoized for performance)
  const sizeClasses = useMemo(() => ({
    small: "w-8 h-8 sm:w-10 sm:h-10",
    default: "w-10 h-10 sm:w-12 sm:h-12",
    large: "w-12 h-12 sm:w-16 sm:h-16",
  }), []);

  const spinner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`text-center ${className}`}
    >
      <div
        className={`${sizeClasses[size]} border-4 border-black dark:border-white border-t-transparent dark:border-t-transparent rounded-full animate-spin mx-auto mb-4`}
      />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: "easeOut" }}
          className="text-black dark:text-white font-bold text-sm sm:text-base"
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen-responsive bg-white dark:bg-black w-full">
        {spinner}
      </div>
    );
  }

  return spinner;
});

LoadingSpinner.displayName = "LoadingSpinner";
