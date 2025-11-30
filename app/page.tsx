/**
 * Main Dashboard Page
 * 
 * This is the primary application page that manages:
 * - User authentication and session handling
 * - Board selection and persistence (localStorage)
 * - Board creation, editing, and deletion
 * - Sidebar navigation
 * - Notification system
 * 
 * Features:
 * - Persists selected board ID across page refreshes
 * - Automatically creates default board if none exist
 * - Handles board CRUD operations
 * - Manages board selection state
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { KanbanBoard } from "@/components/kanban-board";
import { Sidebar } from "@/components/sidebar";
import { CreateBoardDialog } from "@/components/create-board-dialog";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { NotificationSystem } from "@/components/notification-system";
import { logError } from "@/lib/logger";
import { deduplicatedFetch } from "@/lib/request-deduplication";
import { SearchBar, type SearchFilter } from "@/components/search-bar";
import { searchBoards } from "@/lib/search-utils";
import { LoadingSpinner } from "@/components/loading-spinner";

/**
 * Board interface - minimal board representation for list views
 */
interface Board {
  id: string;
  title: string;
  position?: number;
}

/**
 * localStorage key for persisting selected board ID
 */
const BOARD_ID_STORAGE_KEY = "kibble_selected_board_id";

/**
 * Home Component - Main Dashboard
 * 
 * Orchestrates the entire application UI including board management,
 * navigation, and user session handling.
 */
export default function Home() {
  // Session and routing
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  
  // Board state
  const [boards, setBoards] = useState<Board[]>([]);
  // Initialize boardId from localStorage to persist selection across refreshes
  const [boardId, setBoardId] = useState<string | null>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(BOARD_ID_STORAGE_KEY);
      return saved || null;
    }
    return null;
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingDefault, setIsCreatingDefault] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  
  // Refs to track loading state and prevent duplicate loads
  const hasLoadedBoards = useRef(false);
  const isLoadingBoards = useRef(false);

  /**
   * Creates a default board if no boards exist
   * 
   * This is called when a user has no boards yet.
   * Creates a board titled "Default" and sets it as the active board.
   * 
   * Includes protection against multiple simultaneous calls.
   */
  const createDefaultBoard = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isCreatingDefault) {
      return;
    }

    setIsCreatingDefault(true);
    setError(null);

    try {
      const res = await deduplicatedFetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Default" }),
      });

      // Clone response immediately to avoid body stream issues
      const resClone = res.clone();

      if (!res.ok) {
        const errorData = await resClone.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to create default board";
        throw new Error(errorMessage);
      }

      // Read from original response (clone is for error handling only)
      const board = await res.json();
      
      // Update local state directly to avoid circular dependency
      setBoards([board]);
      setBoardId(board.id);
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(BOARD_ID_STORAGE_KEY, board.id);
      }
    } catch (error) {
        logError("[BOARD CREATE] Error creating default board:", error);
      setError(error instanceof Error ? error.message : "Failed to create default board");
    } finally {
      setIsCreatingDefault(false);
    }
  }, [isCreatingDefault]);

  /**
   * Loads all boards for the current user
   * 
   * Process:
   * 1. Fetches boards from API
   * 2. Sets active board with priority:
   *    - Saved board from localStorage (if it exists in fetched boards)
   *    - First board in list
   * 3. Creates default board if no boards exist
   * 4. Persists selected board to localStorage
   * 
   */
  const loadBoards = useCallback(async () => {
    // Prevent duplicate concurrent loads
    if (isLoadingBoards.current) {
      return; // Already loading, skip
    }
    
    isLoadingBoards.current = true;
    setError(null);
    setLoading(true);
    hasLoadedBoards.current = true;

    // Add timeout protection (30 seconds max)
    const timeoutId = setTimeout(() => {
      logError("[BOARD LOAD] Timeout loading boards - resetting state");
      hasLoadedBoards.current = false;
      isLoadingBoards.current = false;
      setLoading(false);
      setError("Request timed out. Please try again.");
    }, 30000);

    try {
      const res = await deduplicatedFetch("/api/boards/list");
      
      clearTimeout(timeoutId);
      
      // Clone response for error handling (deduplicatedFetch already returns a clone)
      const resClone = res.clone();
      
      if (!res.ok) {
        const errorData = await resClone.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to load boards";
        
        // If unauthorized, redirect to sign in
        if (res.status === 401 || res.status === 403) {
          router.push("/auth/signin");
          return;
        }
        
        throw new Error(errorMessage);
      }
      
      // Read response body
      const data = await res.json();
      const boardsList = data.boards ?? [];
      
      // Update boards state
      setBoards(boardsList);
      
      // Mark as successfully loaded
      hasLoadedBoards.current = true;
      
      // Set board as active, prioritizing saved selection
      if (boardsList.length > 0) {
        // Get saved boardId from localStorage
        const savedBoardId = typeof window !== "undefined" 
          ? localStorage.getItem(BOARD_ID_STORAGE_KEY) 
          : null;
        
        // Check if saved boardId exists in the fetched boards
        const savedBoardExists = savedBoardId && boardsList.some((b: Board) => b.id === savedBoardId);
        
        // Use saved board if it exists and is valid, otherwise use first board
        const targetBoardId = savedBoardExists ? savedBoardId : boardsList[0].id;
        
        // Validate that the target board ID exists in the list
        const isValidBoard = boardsList.some((b: Board) => b.id === targetBoardId);
        
        if (isValidBoard) {
          setBoardId(targetBoardId);
          // Persist to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(BOARD_ID_STORAGE_KEY, targetBoardId);
          }
        } else {
          // Fallback: use first board if target is invalid
          setBoardId(boardsList[0].id);
          if (typeof window !== "undefined") {
            localStorage.setItem(BOARD_ID_STORAGE_KEY, boardsList[0].id);
          }
        }
      } else {
        // Create default board if none exist
        // Clear any invalid boardId from localStorage first
        if (typeof window !== "undefined") {
          localStorage.removeItem(BOARD_ID_STORAGE_KEY);
        }
        setBoardId(null);
        await createDefaultBoard();
      }
    } catch (error) {
      clearTimeout(timeoutId);
      logError("[BOARD LOAD] Error loading boards:", error);
      setError(error instanceof Error ? error.message : "Failed to load boards");
      // Clear invalid boardId
      setBoardId(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(BOARD_ID_STORAGE_KEY);
      }
      // Reset refs on error to allow retry
      hasLoadedBoards.current = false;
      isLoadingBoards.current = false;
    } finally {
      clearTimeout(timeoutId);
      isLoadingBoards.current = false;
      setLoading(false);
    }
  }, [createDefaultBoard, router]);

  /**
   * Reset boards state when navigating to main page
   * 
   * This effect ensures that when users navigate back to the main page,
   * the boards state is reset and ready to reload.
   * 
   */
  useEffect(() => {
    // When on main page (pathname === "/") and authenticated
    if (pathname === "/" && status === "authenticated") {
      // Always reset refs when navigating to main page
      // This ensures boards will reload when returning from other pages
      // Check if we're returning from another page (boards might be empty or stale)
      const shouldReset = boards.length === 0 || !hasLoadedBoards.current;
      
      if (shouldReset) {
        hasLoadedBoards.current = false;
        isLoadingBoards.current = false;
        setLoading(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, status]);

  /**
   * Authentication and board loading effect
   * 
   * Redirects unauthenticated users to sign-in page.
   * Loads boards when user is authenticated.
   * 
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Only load boards when on main page and authenticated
    // This prevents loading boards when on other pages
    if (
      pathname === "/" &&
      status === "authenticated" &&
      !isLoadingBoards.current
    ) {
      // Load if boards haven't been loaded or if boards array is empty
      if (!hasLoadedBoards.current || boards.length === 0) {
        loadBoards();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, status]);

  /**
   * Listen for archive events to refresh boards list
   * 
   * When boards are restored from archive page, this will automatically
   * refresh the boards list on the main page without requiring a page refresh.
   */
  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/") {
      return;
    }

    /**
     * Handle storage events (triggered when restoring from other tabs/pages)
     */
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "kibble:archive:updated" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          // Refresh boards list when boards are restored
          if (data.type === "boards" || data.type === "both") {
            hasLoadedBoards.current = false;
            loadBoards();
          }
        } catch (err) {
          // Ignore parsing errors
        }
      }
    };

    /**
     * Handle custom events (triggered when restoring from same tab)
     */
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const data = customEvent.detail;
        // Refresh boards list when boards are restored
        if (data.type === "boards" || data.type === "both") {
          hasLoadedBoards.current = false;
          loadBoards();
        }
      }
    };

    // Listen for storage events (cross-tab communication)
    window.addEventListener("storage", handleStorageEvent);
    // Listen for custom events (same-tab communication)
    window.addEventListener("kibble:archive:updated", handleCustomEvent);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      window.removeEventListener("kibble:archive:updated", handleCustomEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /**
   * Handles board creation
   * 
   * @param title - Title for the new board
   * 
   * Creates a new board, refetches the boards list, and sets the new board as active.
   * 
   */
  const handleCreateBoard = async (title: string) => {
    try {
      // Ensure boards are loaded first (in case we're returning from another page)
      if (!hasLoadedBoards.current || boards.length === 0) {
        await loadBoards();
      }

      const res = await deduplicatedFetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      // Clone response immediately to avoid body stream issues
      const resClone = res.clone();
      
      if (!res.ok) {
        const errorData = await resClone.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to create board";
        throw new Error(errorMessage);
      }

      // Read from original response (clone is for error handling only)
      const newBoard = await res.json();

      // Set the newly created board as active and persist first
      setBoardId(newBoard.id);
      if (typeof window !== "undefined") {
        localStorage.setItem(BOARD_ID_STORAGE_KEY, newBoard.id);
      }
      
      // Reset ref to allow reload
      hasLoadedBoards.current = false;
      // Refetch boards list to ensure consistency with database
      await loadBoards();
    } catch (error) {
        logError("[BOARD CREATE] Error creating board:", error);
      throw error;
    }
  };

  /**
   * Handles board selection
   * 
   * @param id - ID of the board to select
   * 
   * Sets the selected board as active and persists to localStorage.
   */
  const handleBoardSelect = useCallback((id: string) => {
    setBoardId(id);
    // Persist selected board to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(BOARD_ID_STORAGE_KEY, id);
    }
  }, []);

  /**
   * Handles board reordering
   * 
   * @param reorderedBoards - Boards in new order with updated positions
   * 
   * Optimistically updates the boards state when boards are reordered via drag-and-drop.
   */
  const handleBoardsReorder = useCallback((reorderedBoards: Board[]) => {
    setBoards(reorderedBoards);
  }, []);

  /**
   * Handles board edit action
   * 
   * @param board - Board to edit
   * 
   * Opens the edit dialog for the specified board.
   */
  const handleBoardEdit = useCallback((board: Board) => {
    setEditingBoard(board);
  }, []);

  /**
   * Handles board delete action
   * 
   * @param board - Board to delete
   * 
   * Opens the delete confirmation dialog for the specified board.
   */
  const handleBoardDelete = useCallback((board: Board) => {
    setDeletingBoard(board);
  }, []);

  /**
   * Handles board archive action
   * 
   * @param board - Board to archive
   * 
   * Archives the board (does not delete).
   */
  const handleBoardArchive = useCallback(async (board: Board) => {
    try {
      const response = await deduplicatedFetch(`/api/boards/${board.id}/archive`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to archive board");
      }

      // Emit archive event for real-time updates in archive page
      if (typeof window !== "undefined") {
        const { emitArchiveEvent } = await import("@/lib/archive-events");
        emitArchiveEvent("boards");
      }

      // Clear localStorage if archived board was the selected one
      if (typeof window !== "undefined") {
        const savedBoardId = localStorage.getItem(BOARD_ID_STORAGE_KEY);
        if (savedBoardId === board.id) {
          localStorage.removeItem(BOARD_ID_STORAGE_KEY);
          setBoardId(null);
        }
      }

      // Reset ref to allow reload
      hasLoadedBoards.current = false;
      // Refetch boards list
      await loadBoards();
    } catch (error) {
        logError("[BOARD ARCHIVE] Error archiving board:", error);
    }
  }, [loadBoards]);

  /**
   * Handles board update completion
   * 
   * Refetches boards list and closes the edit dialog.
   */
  const handleBoardUpdate = useCallback(async () => {
    hasLoadedBoards.current = false;
    await loadBoards();
    setEditingBoard(null);
  }, [loadBoards]);

  /**
   * Handles confirmed board deletion
   * 
   * Deletes the board from the database, clears localStorage if needed,
   * and refetches the boards list.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingBoard) return;

    try {
      const response = await deduplicatedFetch(`/api/boards/${deletingBoard.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete board");
      }

      // Clear localStorage if deleted board was the selected one
      if (typeof window !== "undefined") {
        const savedBoardId = localStorage.getItem(BOARD_ID_STORAGE_KEY);
        if (savedBoardId === deletingBoard.id) {
          localStorage.removeItem(BOARD_ID_STORAGE_KEY);
        }
      }

      // Reset ref to allow reload
      hasLoadedBoards.current = false;
      // Refetch boards list to ensure consistency with database
      await loadBoards();

      setDeletingBoard(null);
    } catch (error) {
        logError("[BOARD DELETE] Error deleting board:", error);
      alert(error instanceof Error ? error.message : "Failed to delete board");
    }
  }, [deletingBoard, loadBoards]);

  // Add timeout for stuck loading states (show error after 35 seconds)
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  useEffect(() => {
    if (loading && !isCreatingDefault) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
        // Force reset loading state if stuck
        hasLoadedBoards.current = false;
        isLoadingBoards.current = false;
        setLoading(false);
        setError("Loading took too long. Please refresh the page or try again.");
      }, 35000); // 35 seconds (slightly longer than API timeout)
      
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading, isCreatingDefault]);

  if (status === "loading" || (loading && !loadingTimeout) || isCreatingDefault) {
    return (
      <LoadingSpinner
        message={isCreatingDefault ? "Creating your first board..." : "Loading your boards..."}
      />
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  // Show error state if there's an error or loading timeout
  if ((error || loadingTimeout) && boards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen-responsive bg-white dark:bg-black w-full">
        <div className="text-center max-w-md px-4">
          <p className="text-black dark:text-white font-bold text-sm sm:text-base mb-2">
            {loadingTimeout ? "Loading timeout" : "Error loading boards"}
          </p>
          <p className="text-xs text-black/60 dark:text-white/60 font-bold mb-4">
            {loadingTimeout ? "The request took too long. Please try again." : error}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setError(null);
                setLoadingTimeout(false);
                hasLoadedBoards.current = false;
                isLoadingBoards.current = false;
                setLoading(true);
                loadBoards();
              }}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold"
              type="button"
            >
              Retry
            </button>
            <button
              onClick={() => {
                setError(null);
                setLoadingTimeout(false);
                setShowCreateDialog(true);
              }}
              className="px-4 py-2 border border-black dark:border-white text-black dark:text-white rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-xs sm:text-sm font-bold"
              type="button"
            >
              Create Board
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

  if (!boardId) {
    return (
      <div className="flex items-center justify-center min-h-screen-responsive bg-white dark:bg-black w-full">
        <div className="text-center">
          <p className="text-black dark:text-white font-bold text-sm sm:text-base mb-2">No board selected</p>
          <p className="text-xs text-black/60 dark:text-white/60 font-bold mb-4">Select a board from the sidebar or create a new one.</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold"
            type="button"
          >
            Create Board
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen-responsive bg-white dark:bg-black overflow-hidden w-full">
      <Sidebar
        boards={boards}
        currentBoardId={boardId}
        onBoardSelect={handleBoardSelect}
        onNewBoard={() => setShowCreateDialog(true)}
        onBoardEdit={handleBoardEdit}
        onBoardDelete={handleBoardDelete}
        onBoardArchive={handleBoardArchive}
        onBoardsReorder={handleBoardsReorder}
      />
      
      <main className="flex-1 overflow-hidden lg:ml-64 xl:ml-72 pt-12 sm:pt-14 md:pt-16 lg:pt-0 w-full min-w-0 flex flex-col">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 w-full min-w-0 flex flex-col"
        >
          {boardId && boards.some((b) => b.id === boardId) ? (
            <KanbanBoard boardId={boardId} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-black dark:text-white font-bold text-sm sm:text-base mb-2">Board not found</p>
                <p className="text-xs text-black/60 dark:text-white/60 font-bold mb-4">The selected board may have been deleted.</p>
                <button
                  onClick={() => {
                    if (boards.length > 0) {
                      handleBoardSelect(boards[0].id);
                    } else {
                      setShowCreateDialog(true);
                    }
                  }}
                  className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded hover:opacity-80 transition-opacity text-xs sm:text-sm font-bold"
                  type="button"
                >
                  {boards.length > 0 ? "Select First Board" : "Create Board"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <CreateBoardDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateBoard}
      />

      {editingBoard && (
        <EditBoardDialog
          isOpen={!!editingBoard}
          onClose={() => setEditingBoard(null)}
          boardTitle={editingBoard.title}
          boardId={editingBoard.id}
          onUpdate={handleBoardUpdate}
        />
      )}

      <DeleteConfirmationDialog
        isOpen={!!deletingBoard}
        onClose={() => setDeletingBoard(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Board"
        message="Are you sure you want to delete this board? This will permanently delete the board and all its tasks. This action cannot be undone."
        itemName={deletingBoard?.title || ""}
      />

      <NotificationSystem />
    </div>
  );
}
