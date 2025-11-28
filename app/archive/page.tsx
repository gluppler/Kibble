/**
 * Archive Page Component
 * 
 * Displays archived boards and tasks with options to restore or export.
 * 
 * Features:
 * - Tabbed interface for boards and tasks
 * - Restore functionality
 * - CSV export functionality
 * - Filter and search capabilities
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { logError, logWarn } from "@/lib/logger";
import { deduplicatedFetch } from "@/lib/request-deduplication";
import {
  Archive,
  ArrowLeft,
  Download,
  RotateCcw,
  Folder,
  CheckSquare,
  Calendar,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface ArchivedBoard {
  id: string;
  title: string;
  archivedAt: string | null;
  createdAt: string;
  columns: Array<{
    id: string;
    title: string;
    tasks: Array<{ id: string; title: string }>;
  }>;
}

interface ArchivedTask {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  column: {
    id: string;
    title: string;
    board: {
      id: string;
      title: string;
    };
  };
}

export default function ArchivePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<"boards" | "tasks">("tasks");
  const [boards, setBoards] = useState<ArchivedBoard[]>([]);
  const [tasks, setTasks] = useState<ArchivedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [restoring, setRestoring] = useState<string | null>(null);
  
  // Refs to prevent duplicate API calls
  const isFetchingRef = useRef(false);
  const hasInitialLoadRef = useRef(false);
  const lastPathnameRef = useRef<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  /**
   * Fetches archived items from the API
   * 
   * @param silent - If true, uses refreshing state instead of loading state (for background updates)
   * @param fetchBoth - If true, fetches both boards and tasks regardless of active tab (for initial load)
   * 
   * Security:
   * - Uses request deduplication to prevent duplicate concurrent requests
   * - Includes ref tracking to prevent multiple simultaneous calls
   */
  const fetchArchivedItems = useCallback(async (silent = false, fetchBoth = false) => {
    // Prevent duplicate concurrent requests
    if (isFetchingRef.current && !silent) {
      return;
    }

    isFetchingRef.current = true;

    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError("");
    
    try {
      // If fetchBoth is true (initial load), fetch both boards and tasks
      // This ensures counts are accurate when switching tabs
      if (fetchBoth) {
        const [boardsRes, tasksRes] = await Promise.all([
          deduplicatedFetch("/api/archive/boards"),
          deduplicatedFetch("/api/archive/tasks"),
        ]);
        
        if (!boardsRes.ok) throw new Error("Failed to fetch archived boards");
        if (!tasksRes.ok) throw new Error("Failed to fetch archived tasks");
        
        const boardsData = await boardsRes.json();
        const tasksData = await tasksRes.json();
        
        setBoards(boardsData.boards || []);
        setTasks(tasksData.tasks || []);
        hasInitialLoadRef.current = true;
      } else {
        // Normal fetch based on active tab
        if (activeTab === "boards") {
          const res = await deduplicatedFetch("/api/archive/boards");
          if (!res.ok) throw new Error("Failed to fetch archived boards");
          const data = await res.json();
          setBoards(data.boards || []);
        } else {
          const res = await deduplicatedFetch("/api/archive/tasks");
          if (!res.ok) throw new Error("Failed to fetch archived tasks");
          const data = await res.json();
          setTasks(data.tasks || []);
        }
      }
    } catch (err) {
      // Ignore abort errors (request cancellation)
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      // Handle "Response already consumed" errors gracefully
      if (err instanceof Error && err.message.includes("Response already consumed")) {
        logWarn("Response already consumed - retrying fetch");
        // Reset fetching ref before retry
        isFetchingRef.current = false;
        // Retry once after a short delay
        setTimeout(() => {
          fetchArchivedItems(silent, fetchBoth);
        }, 100);
        return;
      }
      logError("Error fetching archived items:", err);
      setError("Failed to load archived items");
    } finally {
      // Always reset fetching ref and loading state
      isFetchingRef.current = false;
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [activeTab]);

  // Reset state when navigating to archive page
  useEffect(() => {
    // Only reset when pathname changes to /archive (user navigated to this page)
    if (pathname === "/archive" && status === "authenticated" && session?.user?.id) {
      // Check if this is a new navigation (pathname changed)
      if (lastPathnameRef.current !== pathname) {
        lastPathnameRef.current = pathname;
        // Reset refs to allow fresh load
        isFetchingRef.current = false;
        hasInitialLoadRef.current = false;
        setLoading(true);
        setError("");
      }
    }
  }, [pathname, status, session?.user?.id]);

  // Fetch archived items on mount (fetch both for accurate counts)
  useEffect(() => {
    if (
      pathname === "/archive" &&
      status === "authenticated" &&
      session?.user?.id &&
      !hasInitialLoadRef.current &&
      !isFetchingRef.current
    ) {
      // On initial mount or navigation, fetch both boards and tasks to ensure counts are accurate
      fetchArchivedItems(false, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, status, session?.user?.id]);

  // Fetch archived items when tab changes (only fetch the active tab)
  const prevActiveTabRef = useRef<"boards" | "tasks">(activeTab);
  useEffect(() => {
    // Only fetch if initial load is complete and tab actually changed
    if (
      status === "authenticated" &&
      session?.user?.id &&
      hasInitialLoadRef.current &&
      prevActiveTabRef.current !== activeTab
    ) {
      prevActiveTabRef.current = activeTab;
      // When tab changes, only fetch the active tab (optimization)
      fetchArchivedItems(false, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, status, session?.user?.id]);

  /**
   * Real-time updates for archive page
   * 
   * Uses multiple strategies:
   * 1. Periodic polling (every 30 seconds when tab is visible)
   * 2. Visibility API to pause polling when tab is hidden
   * 3. localStorage events to trigger immediate updates when archiving from other pages
   */
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    let intervalId: NodeJS.Timeout | null = null;

    /**
     * Poll for updates (only when tab is visible)
     */
    const startPolling = () => {
      // Clear any existing interval
      if (intervalId) clearInterval(intervalId);

      // Poll every 30 seconds
      intervalId = setInterval(() => {
        // Only poll if tab is visible and initial load is complete
        if (typeof document !== "undefined" && !document.hidden && hasInitialLoadRef.current) {
          fetchArchivedItems(true); // true = silent refresh (no loading spinner)
        }
      }, 30 * 1000); // 30 seconds
    };

    /**
     * Handle visibility change
     * Pause polling when tab is hidden, resume when visible
     */
    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;

      if (document.hidden) {
        // Tab is hidden - stop polling
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        // Tab is visible - start polling and immediately refresh (if initial load complete)
        if (hasInitialLoadRef.current) {
          fetchArchivedItems(true); // Silent refresh
        }
        startPolling();
      }
    };

    /**
     * Handle storage events (triggered when archiving from other tabs/pages)
     * Listens for archive events from other pages
     */
    const handleStorageEvent = (e: StorageEvent) => {
      // Check if this is an archive event
      if (e.key === "kibble:archive:updated" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          // Only refresh if the event is for the current tab and initial load is complete
          if ((data.type === activeTab || data.type === "both") && hasInitialLoadRef.current) {
            fetchArchivedItems(true); // Silent refresh
          }
        } catch (err) {
          logWarn("Error parsing storage event:", err);
        }
      }
    };

    /**
     * Handle custom events (triggered when archiving from same tab)
     * Listens for custom events from the same page
     */
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const data = customEvent.detail;
        // Only refresh if the event is for the current tab and initial load is complete
        if ((data.type === activeTab || data.type === "both") && hasInitialLoadRef.current) {
          fetchArchivedItems(true); // Silent refresh
        }
      }
    };

    // Start initial polling
    startPolling();

    // Listen for visibility changes
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Listen for storage events (cross-tab communication)
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageEvent);
      // Listen for custom events (same-tab communication)
      window.addEventListener("kibble:archive:updated", handleCustomEvent);
    }

    // Cleanup
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageEvent);
        window.removeEventListener("kibble:archive:updated", handleCustomEvent);
      }
    };
  }, [status, session, activeTab, fetchArchivedItems]);

  /**
   * Manual refresh handler
   */
  const handleRefresh = useCallback(async () => {
    await fetchArchivedItems(false); // Show loading state for manual refresh
  }, [fetchArchivedItems]);

  const handleRestoreBoard = async (boardId: string) => {
    setRestoring(boardId);
    try {
      const res = await deduplicatedFetch(`/api/boards/${boardId}/archive`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to restore board");
      
      // Emit archive event for real-time updates
      if (typeof window !== "undefined") {
        const { emitArchiveEvent } = await import("@/lib/archive-events");
        emitArchiveEvent("boards");
      }
      
      await fetchArchivedItems();
    } catch (err) {
      logError("Error restoring board:", err);
      setError("Failed to restore board");
    } finally {
      setRestoring(null);
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    setRestoring(taskId);
    try {
      const res = await deduplicatedFetch(`/api/tasks/${taskId}/archive`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to restore task");
      
      // Emit archive event for real-time updates
      if (typeof window !== "undefined") {
        const { emitArchiveEvent } = await import("@/lib/archive-events");
        emitArchiveEvent("tasks");
      }
      
      await fetchArchivedItems();
    } catch (err) {
      logError("Error restoring task:", err);
      setError("Failed to restore task");
    } finally {
      setRestoring(null);
    }
  };

  const handleExport = async (type: "boards" | "tasks") => {
    try {
      const res = await deduplicatedFetch(`/api/archive/export?type=${type}`);
      if (!res.ok) throw new Error("Failed to export");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kibble-archived-${type}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logError("Error exporting:", err);
      setError("Failed to export archive");
    }
  };

  // Add timeout protection for stuck loading states
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (loading && status === "authenticated") {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
        // Force reset loading state if stuck
        isFetchingRef.current = false;
        hasInitialLoadRef.current = false;
        setLoading(false);
        setError("Loading took too long. Please refresh the page or try again.");
      }, 30000); // 30 seconds timeout
      
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading, status]);

  if (status === "loading" || (loading && !loadingTimeout)) {
    return (
      <div className="min-h-screen-responsive bg-white dark:bg-black flex items-center justify-center w-full">
        <div className="text-black dark:text-white font-bold">Loading...</div>
      </div>
    );
  }

  // Show error state if loading timed out
  if (loadingTimeout && boards.length === 0 && tasks.length === 0) {
    return (
      <div className="min-h-screen-responsive bg-white dark:bg-black flex items-center justify-center w-full">
        <div className="text-center max-w-md px-4">
          <p className="text-black dark:text-white font-bold text-sm sm:text-base mb-2">
            Loading timeout
          </p>
          <p className="text-xs text-black/60 dark:text-white/60 font-bold mb-4">
            The request took too long. Please try again.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setLoadingTimeout(false);
                isFetchingRef.current = false;
                hasInitialLoadRef.current = false;
                setLoading(true);
                fetchArchivedItems(false, true);
              }}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold"
              type="button"
            >
              Retry
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              className="px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs sm:text-sm font-bold"
              type="button"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session) {
    return null;
  }

  return (
    <div className="min-h-screen-responsive bg-white dark:bg-black w-full">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12 w-full">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white mb-4 sm:mb-6 transition-colors font-bold"
          >
            <ArrowLeft size={16} />
            <span className="text-xs sm:text-sm">Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center">
              <Archive className="text-white dark:text-black" size={18} />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black dark:text-white">
              Archive
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 font-bold">
            View and manage your archived boards and tasks
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-black/10 dark:bg-white/10 border border-black/20 dark:border-white/20 rounded-lg">
            <p className="text-xs sm:text-sm text-black dark:text-white font-bold">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 sm:mb-6 border-b border-black/10 dark:border-white/10">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold transition-colors border-b-2 ${
              activeTab === "tasks"
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckSquare size={14} />
              Tasks ({tasks.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("boards")}
            className={`px-4 py-2 text-xs sm:text-sm font-bold transition-colors border-b-2 ${
              activeTab === "boards"
                ? "border-black dark:border-white text-black dark:text-white"
                : "border-transparent text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder size={14} />
              Boards ({boards.length})
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mb-4 sm:mb-6 flex justify-end gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="px-4 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold flex items-center gap-2"
            title="Refresh archive"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => handleExport(activeTab)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold flex items-center gap-2"
          >
            <Download size={14} />
            Export {activeTab === "boards" ? "Boards" : "Tasks"} to CSV
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "tasks" ? (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {tasks.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Archive className="mx-auto mb-4 text-black/20 dark:text-white/20" size={48} />
                  <p className="text-sm font-bold text-black/60 dark:text-white/60 mb-2">
                    No archived tasks
                  </p>
                  <p className="text-xs text-black/40 dark:text-white/40 font-bold">
                    Tasks you archive will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/10 p-4 sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-black dark:text-white mb-1 truncate">
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-xs sm:text-sm text-black/60 dark:text-white/60 mb-2 font-bold line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-black/60 dark:text-white/60 font-bold">
                            <span className="flex items-center gap-1">
                              <Folder size={12} />
                              {task.column.board.title}
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckSquare size={12} />
                              {task.column.title}
                            </span>
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                            {task.archivedAt && (
                              <span>
                                Archived: {new Date(task.archivedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRestoreTask(task.id)}
                          disabled={restoring === task.id}
                          className="px-3 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0"
                        >
                          {restoring === task.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            <>
                              <RotateCcw size={14} />
                              Restore
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="boards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {boards.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Archive className="mx-auto mb-4 text-black/20 dark:text-white/20" size={48} />
                  <p className="text-sm font-bold text-black/60 dark:text-white/60 mb-2">
                    No archived boards
                  </p>
                  <p className="text-xs text-black/40 dark:text-white/40 font-bold">
                    Boards you archive will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {boards.map((board) => {
                    const taskCount = board.columns.reduce(
                      (sum, col) => sum + col.tasks.length,
                      0
                    );
                    return (
                      <div
                        key={board.id}
                        className="bg-white dark:bg-black rounded-lg border border-black/10 dark:border-white/10 p-4 sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-black dark:text-white mb-1 truncate">
                              {board.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-black/60 dark:text-white/60 font-bold">
                              <span>
                                {board.columns.length} column{board.columns.length !== 1 ? "s" : ""}
                              </span>
                              <span>
                                {taskCount} task{taskCount !== 1 ? "s" : ""}
                              </span>
                              {board.archivedAt && (
                                <span>
                                  Archived: {new Date(board.archivedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestoreBoard(board.id)}
                            disabled={restoring === board.id}
                            className="px-3 py-2 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0"
                          >
                            {restoring === board.id ? (
                              <>
                                <div className="w-3 h-3 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
                                Restoring...
                              </>
                            ) : (
                              <>
                                <RotateCcw size={14} />
                                Restore
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
