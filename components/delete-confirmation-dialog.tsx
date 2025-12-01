"use client";

import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName: string;
  loading?: boolean;
}

export const DeleteConfirmationDialog = memo(function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false,
}: DeleteConfirmationDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white dark:bg-black rounded-lg shadow-2xl w-full max-w-md mx-3 sm:mx-4 p-4 sm:p-6 border border-black/10 dark:border-white/10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-black dark:bg-white flex items-center justify-center">
                    <AlertTriangle className="text-white dark:text-black" size={16} />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">
                    {title}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                  aria-label="Close"
                  type="button"
                >
                  <X className="text-black dark:text-white" size={18} />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mb-2 font-bold">
                {message}
              </p>
              <p className="font-bold text-black dark:text-white mb-4 sm:mb-6 text-sm sm:text-base">
                "{itemName}"
              </p>

              <div className="flex gap-2 sm:gap-3">
                <motion.button
                  onClick={onConfirm}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-black dark:bg-white text-white dark:text-black hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-opacity text-xs sm:text-sm font-bold"
                  type="button"
                >
                  {loading ? "Deleting..." : "Delete"}
                </motion.button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold"
                    aria-label="Cancel deletion"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

DeleteConfirmationDialog.displayName = "DeleteConfirmationDialog";
