"use client";

import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { markUserInteraction } from "@/lib/interaction-detector";

interface CreateBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}

export const CreateBoardDialog = memo(function CreateBoardDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateBoardDialogProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Board title is required");
      return;
    }

    setLoading(true);
    try {
      await onCreate(title.trim());
      setTitle("");
      onClose();
    } catch (err) {
      setError("Failed to create board. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [title, onCreate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
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
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">
                  Create New Kanban
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                  type="button"
                  aria-label="Close dialog"
                >
                  <X className="text-black dark:text-white" size={18} />
                </button>
              </div>

              <form 
                onSubmit={handleSubmit} 
                onFocus={() => markUserInteraction()}
                onClick={() => markUserInteraction()}
                className="space-y-3 sm:space-y-4"
              >
                {error && (
                  <div className="p-3 rounded-lg bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white text-xs sm:text-sm font-bold">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="board-title"
                    className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-2"
                  >
                    Board Name
                  </label>
                  <input
                    id="board-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Project Alpha, Marketing Campaign"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm font-bold"
                    autoFocus
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-2 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold"
                    aria-label="Cancel board creation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !title.trim()}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold"
                    aria-label={loading ? "Creating board..." : "Create board"}
                  >
                    {loading ? "Creating..." : "Create Board"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

CreateBoardDialog.displayName = "CreateBoardDialog";
