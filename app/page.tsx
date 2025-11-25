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

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KanbanBoard } from "@/components/kanban-board";
import { Sidebar } from "@/components/sidebar";
import { CreateBoardDialog } from "@/components/create-board-dialog";
import { EditBoardDialog } from "@/components/edit-board-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { NotificationSystem } from "@/components/notification-system";

/**
 * Board interface - minimal board representation for list views
 */
interface Board {
  id: string;
  title: string;
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
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [deletingBoard, setDeletingBoard] = useState<Board | null>(null);

  /**
   * Authentication and board loading effect
   * 
   * Redirects unauthenticated users to sign-in page.
   * Loads boards when user is authenticated.
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      loadBoards();
    }
  }, [status, router]);

  /**
   * Creates a default board if no boards exist
   * 
   * This is called when a user has no boards yet.
   * Creates a board titled "Default" and sets it as the active board.
   */
  const createDefaultBoard = useCallback(async () => {
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Default" }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create default board");
      }

      const board = await res.json();
      
      // Update local state directly to avoid circular dependency
      setBoards([board]);
      setBoardId(board.id);
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(BOARD_ID_STORAGE_KEY, board.id);
      }
    } catch (error) {
      console.error("[BOARD CREATE] Error creating default board:", error);
    }
  }, []);

  /**
   * Loads all boards for the current user
   * 
   * Process:
   * 1. Fetches boards from API
   * 2. Sets active board with priority:
   *    - Saved board from localStorage (if it exists in fetched boards)
   *    - Current boardId (if it exists in fetched boards)
   *    - First board in list
   * 3. Creates default board if no boards exist
   * 4. Persists selected board to localStorage
   */
  const loadBoards = useCallback(async () => {
    try {
      const res = await fetch("/api/boards/list");
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to load boards");
      }
      
      const data = await res.json();
      const boardsList = data.boards || [];
      
      setBoards(boardsList);
      
      // Set board as active, prioritizing saved selection
      if (boardsList.length > 0) {
        // Get saved boardId from localStorage
        const savedBoardId = typeof window !== "undefined" 
          ? localStorage.getItem(BOARD_ID_STORAGE_KEY) 
          : null;
        
        // Check if saved boardId exists in the fetched boards
        const savedBoardExists = savedBoardId && boardsList.some((b: Board) => b.id === savedBoardId);
        
        // Use saved board if it exists, otherwise use current boardId if it exists, otherwise use first board
        const targetBoardId = savedBoardExists 
          ? savedBoardId 
          : (boardId && boardsList.some((b: Board) => b.id === boardId))
            ? boardId
            : boardsList[0].id;
        
        setBoardId(targetBoardId);
        
        // Persist to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(BOARD_ID_STORAGE_KEY, targetBoardId);
        }
      } else {
        // Create default board if none exist
        await createDefaultBoard();
      }
    } catch (error) {
      console.error("[BOARD LOAD] Error loading boards:", error);
    } finally {
      setLoading(false);
    }
  }, [createDefaultBoard, boardId]);

  /**
   * Handles board creation
   * 
   * @param title - Title for the new board
   * 
   * Creates a new board, refetches the boards list, and sets the new board as active.
   */
  const handleCreateBoard = async (title: string) => {
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to create board";
        throw new Error(errorMessage);
      }

      const newBoard = await res.json();

      // Refetch boards list to ensure consistency with database
      await loadBoards();
      
      // Set the newly created board as active and persist
      setBoardId(newBoard.id);
      if (typeof window !== "undefined") {
        localStorage.setItem(BOARD_ID_STORAGE_KEY, newBoard.id);
      }
    } catch (error) {
      console.error("[BOARD CREATE] Error creating board:", error);
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
   * Handles board update completion
   * 
   * Refetches boards list and closes the edit dialog.
   */
  const handleBoardUpdate = useCallback(async () => {
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
      const response = await fetch(`/api/boards/${deletingBoard.id}`, {
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

      // Refetch boards list to ensure consistency with database
      await loadBoards();

      setDeletingBoard(null);
    } catch (error) {
      console.error("[BOARD DELETE] Error deleting board:", error);
      alert(error instanceof Error ? error.message : "Failed to delete board");
    }
  }, [deletingBoard, loadBoards]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your boards...</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  if (!boardId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400">Failed to load board</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar
        boards={boards}
        currentBoardId={boardId}
        onBoardSelect={handleBoardSelect}
        onNewBoard={() => setShowCreateDialog(true)}
        onBoardEdit={handleBoardEdit}
        onBoardDelete={handleBoardDelete}
      />
      
      <main className="flex-1 overflow-hidden lg:ml-64 xl:ml-72 pt-14 sm:pt-16 lg:pt-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <KanbanBoard boardId={boardId} />
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
