"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { Task } from "@/lib/types";
import { useAlerts } from "@/contexts/alert-context";
import { getDateInputFormatHint } from "@/lib/date-utils";
import { deduplicatedFetch } from "@/lib/request-deduplication";

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onUpdate: () => void;
}

export function EditTaskDialog({
  isOpen,
  onClose,
  task,
  onUpdate,
}: EditTaskDialogProps) {
  // Alert context for due date alerts
  const { checkTaskForAlert } = useAlerts();
  
  // Prevent editing locked tasks
  const isLocked = task?.locked || false;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        setDueDate(localDate.toISOString().slice(0, 16));
      } else {
        setDueDate("");
      }
      setError("");
    }
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await deduplicatedFetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          dueDate: dueDate || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update task");
      }

      const updatedTask = await response.json();
      
      // Check for due date alert in real-time if due date was added or changed
      if (updatedTask.dueDate && !task?.locked) {
        checkTaskForAlert(updatedTask);
      }

      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  // Show message if task is locked
  if (isLocked) {
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-black rounded-lg shadow-xl max-w-md w-full mx-3 sm:mx-4 p-4 sm:p-6 border border-black/10 dark:border-white/10"
              >
                <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-3 sm:mb-4">
                  Task is Locked
                </h2>
                <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mb-4 sm:mb-6 font-bold">
                  This task is in the "Done" column and cannot be edited. Tasks in the Done column are automatically locked and will be archived after 24 hours.
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-3 sm:px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold"
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

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
                  Edit Task
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all"
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
                    htmlFor="edit-title"
                    className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-1.5"
                  >
                    Title *
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-2 sm:py-2.5 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-xs sm:text-sm font-bold"
                    placeholder="Task title"
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-description"
                    className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-1.5"
                  >
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 sm:py-2.5 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none transition-all text-xs sm:text-sm font-bold"
                    placeholder="Task description (optional)"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-due-date"
                    className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-1.5"
                  >
                    Due Date
                  </label>
                  <div className="relative">
                    <input
                      id="edit-due-date"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      title={`Due date - Format: ${getDateInputFormatHint()}`}
                      className="w-full px-3 py-2 sm:py-2.5 pr-10 border border-black/20 dark:border-white/20 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-xs sm:text-sm font-bold [color-scheme:light] dark:[color-scheme:dark]"
                      style={{
                        paddingRight: '2.5rem',
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-black/40 dark:text-white/40 font-bold">
                    Format: {getDateInputFormatHint()}
                  </p>
                </div>

                <div className="flex gap-2 sm:gap-3 pt-2">
                  <motion.button
                    type="submit"
                    disabled={loading || !title.trim()}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-black dark:bg-white text-white dark:text-black hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-opacity text-xs sm:text-sm font-bold"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </motion.button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold"
                    aria-label="Cancel editing"
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
