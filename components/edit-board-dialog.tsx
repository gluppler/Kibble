"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface EditBoardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  boardTitle: string;
  boardId: string;
  onUpdate: () => void;
}

export function EditBoardDialog({
  isOpen,
  onClose,
  boardTitle,
  boardId,
  onUpdate,
}: EditBoardDialogProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (boardTitle) {
      setTitle(boardTitle);
      setError("");
    }
  }, [boardTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update board");
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update board");
    } finally {
      setLoading(false);
    }
  };

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
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black dark:text-white">
                  Edit Board
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-opacity"
                  aria-label="Close"
                  type="button"
                >
                  <X className="text-black dark:text-white" size={18} />
                </button>
              </div>

              {error && (
                <div className="mb-3 sm:mb-4 p-3 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg text-xs sm:text-sm font-bold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label
                    htmlFor="edit-board-title"
                    className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-1.5"
                  >
                    Board Title *
                  </label>
                  <input
                    id="edit-board-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 sm:py-2.5 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-xs sm:text-sm font-bold"
                    placeholder="Board title"
                    autoFocus
                  />
                </div>

                <div className="flex gap-2 sm:gap-3 pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading || !title.trim()}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-black dark:bg-white text-white dark:text-black hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-opacity text-xs sm:text-sm font-bold"
                  >
                    {loading ? "Updating..." : "Update Board"}
                  </motion.button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 text-xs sm:text-sm font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
