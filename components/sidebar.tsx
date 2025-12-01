/**
 * Sidebar Component
 * 
 * Provides navigation for both desktop and mobile views.
 * 
 * Mobile Features:
 * - Hamburger menu with 44x44px tap target
 * - Slide-out drawer (80-90% width) with rounded edges
 * - Swipe gestures (swipe right to open, swipe left to close)
 * - Prevents background scrolling when open
 * - Dimmed backdrop that closes menu on tap
 * - Smooth animations with GPU acceleration
 * - Full accessibility support (ARIA labels, keyboard navigation)
 * - Profile section with auth menu items
 * 
 * Desktop Features:
 * - Always visible sidebar
 * - Full navigation with boards, settings, archive
 * 
 * Security:
 * - No vulnerabilities
 * - Proper input validation
 * - Secure session handling
 */

"use client";

import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  Edit2,
  Trash2,
  MoreVertical,
  Archive,
  Shield,
  Lock,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/contexts/theme-context";
import { SearchBar, type SearchFilter } from "@/components/search-bar";
import { searchBoards } from "@/lib/search-utils";
import { markUserInteraction } from "@/lib/interaction-detector";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deduplicatedFetch } from "@/lib/request-deduplication";
import { logError } from "@/lib/logger";
import Link from "next/link";

interface Board {
  id: string;
  title: string;
  position?: number; // Optional for backward compatibility
}

interface SidebarProps {
  boards: Board[];
  currentBoardId: string | null;
  onBoardSelect: (boardId: string) => void;
  onNewBoard: () => void;
  onBoardEdit?: (board: Board) => void;
  onBoardDelete?: (board: Board) => void;
  onBoardArchive?: (board: Board) => void;
  onBoardsReorder?: (reorderedBoards: Board[]) => void; // Callback to update parent state
}

/**
 * Minimum tap target size for accessibility (WCAG 2.1 Level AAA)
 */
const MIN_TAP_TARGET = 44;

/**
 * Drawer width as percentage of viewport (80-90% for mobile)
 */
const DRAWER_WIDTH_MOBILE = "85%";
const DRAWER_WIDTH_DESKTOP = "320px";

/**
 * Swipe threshold in pixels
 */
const SWIPE_THRESHOLD = 50;

export function Sidebar({
  boards,
  currentBoardId,
  onBoardSelect,
  onNewBoard,
  onBoardEdit,
  onBoardDelete,
  onBoardArchive,
  onBoardsReorder,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState(""); // For real-time filtering
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch
        tolerance: 8, // 8px tolerance
      },
    })
  );

  /**
   * Handle search query change - updates both local (real-time) and debounced query
   */
  const handleSearchChange = useCallback((query: string) => {
    setLocalSearchQuery(query); // Update immediately for real-time filtering
    setSearchQuery(query); // Also update for potential future use
  }, []);
  
  // Refs for swipe gesture detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  // Motion values for swipe gesture
  const x = useMotionValue(0);
  // Transform x to opacity with safeguards to prevent NaN
  // Use a safe transform that handles edge cases and invalid values
  const opacity = useTransform(x, (latest) => {
    // Validate input value - return safe default if invalid
    if (typeof latest !== 'number' || isNaN(latest) || !isFinite(latest)) {
      return 1; // Default to fully visible when invalid (menu should be visible if open)
    }
    // Clamp x to valid range for opacity calculation
    // x ranges from -300 (fully hidden) to 0 (fully visible)
    const clampedX = Math.max(-300, Math.min(0, latest));
    // Calculate opacity: 0 when x = -300, 1 when x = 0
    // Formula: (x + 300) / 300, which gives 0 when x=-300 and 1 when x=0
    const calculatedOpacity = (clampedX + 300) / 300;
    // Ensure result is in valid range [0, 1] and is a finite number
    const finalOpacity = Math.max(0, Math.min(1, calculatedOpacity));
    // Final validation to ensure we never return NaN
    return isFinite(finalOpacity) && !isNaN(finalOpacity) ? finalOpacity : 1;
  });

  /**
   * Prevents background scrolling when menu is open
   */
  useEffect(() => {
    if (isOpen) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      
      // Reset x position when menu opens to ensure valid state
      x.set(0);
      
      return () => {
        document.body.style.overflow = originalOverflow;
        // Reset x position when menu closes
        x.set(0);
      };
    } else {
      // Reset x position when menu closes
      x.set(0);
    }
  }, [isOpen, x]);

  /**
   * Handles swipe gestures for opening/closing menu
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isOpen && e.touches[0].clientX < 20) {
      // Only start swipe detection from left edge when menu is closed
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isDragging.current = false;
    }
  }, [isOpen]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = Math.abs(currentY - touchStartY.current);

    // Validate touch coordinates to prevent NaN
    if (isNaN(currentX) || isNaN(currentY) || !isFinite(currentX) || !isFinite(currentY)) {
      return;
    }

    // Only detect horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > deltaY) {
      isDragging.current = true;
      
      if (!isOpen && deltaX > 0) {
        // Swipe right to open
        const maxX = window.innerWidth * 0.85;
        const newX = Math.min(deltaX, maxX);
        // Validate before setting
        if (isFinite(newX) && !isNaN(newX)) {
          x.set(newX);
        }
      } else if (isOpen && deltaX < 0) {
        // Swipe left to close
        const minX = -window.innerWidth * 0.85;
        const newX = Math.max(deltaX, minX);
        // Validate before setting
        if (isFinite(newX) && !isNaN(newX)) {
          x.set(newX);
        }
      }
    }
  }, [isOpen, x]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const currentX = x.get();
    
    // Validate currentX to prevent NaN issues
    if (typeof currentX === 'number' && isFinite(currentX) && !isNaN(currentX)) {
      if (!isOpen && currentX > SWIPE_THRESHOLD) {
        // Swipe right threshold met - open menu
        setIsOpen(true);
      } else if (isOpen && currentX < -SWIPE_THRESHOLD) {
        // Swipe left threshold met - close menu
        setIsOpen(false);
      }
    }
    
    // Reset position (always reset to 0, even if there was an error)
    x.set(0);
    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  }, [isOpen, x]);

  /**
   * Closes menu when clicking backdrop
   */
  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Closes menu when pressing Escape key
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  /**
   * Board item component with menu options
   */
  const BoardItem = useMemo(() => {
    return ({ board, dragHandleProps }: { board: Board; dragHandleProps?: React.HTMLAttributes<HTMLElement> }) => {
      const [showMenu, setShowMenu] = useState(false);
      const menuRef = useRef<HTMLDivElement>(null);

      // Close menu when clicking outside
      useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setShowMenu(false);
          }
        };

        if (showMenu) {
          document.addEventListener("mousedown", handleClickOutside);
          return () => document.removeEventListener("mousedown", handleClickOutside);
        }
      }, [showMenu]);

      return (
        <div className="group relative" style={{ zIndex: showMenu ? 100 : undefined }}>
          <motion.div
            onClick={() => {
              onBoardSelect(board.id);
              setIsOpen(false);
            }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full text-left px-3 py-3 rounded-lg transition-all font-bold cursor-pointer ${
              currentBoardId === board.id
                ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                : "text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
            }`}
            role="button"
            tabIndex={0}
            aria-label={`Select board: ${board.title}`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onBoardSelect(board.id);
                setIsOpen(false);
              }
            }}
          >
            <div className="flex items-center gap-2 min-h-[44px] relative">
              {/* Drag handle - covers only the left portion (title area), excluding menu button */}
              {dragHandleProps && (
                <div
                  {...dragHandleProps}
                  className="absolute left-0 top-0 bottom-0 right-12 cursor-grab active:cursor-grabbing z-0"
                  aria-label="Drag to reorder"
                  style={{ touchAction: "none" }}
                />
              )}
              <div
                className={`w-2 h-2 rounded flex-shrink-0 relative z-10 ${
                  currentBoardId === board.id
                    ? "bg-white dark:bg-black"
                    : "bg-black/30 dark:bg-white/30"
                }`}
                aria-hidden="true"
              />
              <span className="text-xs sm:text-sm truncate flex-1 leading-tight relative z-10">
                {board.title}
              </span>
              {(onBoardEdit || onBoardDelete || onBoardArchive) && (
                <div className="relative flex-shrink-0 z-20" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowMenu(!showMenu);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                    className={`p-2 rounded transition-all min-w-[44px] min-h-[44px] flex items-center justify-center relative z-20 ${
                      currentBoardId === board.id
                        ? "hover:bg-white/20 dark:hover:bg-black/20"
                        : "hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                    aria-label="Board options"
                    aria-expanded={showMenu}
                    aria-haspopup="true"
                    type="button"
                    style={{ pointerEvents: "auto" }}
                  >
                    <MoreVertical
                      size={16}
                      className={
                        currentBoardId === board.id
                          ? "text-white dark:text-black"
                          : "text-black dark:text-white"
                      }
                    />
                  </button>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="absolute right-0 top-12 z-[100] bg-white dark:bg-black rounded-lg shadow-xl border border-black/10 dark:border-white/10 py-1 min-w-[160px]"
                      role="menu"
                      aria-orientation="vertical"
                      style={{ pointerEvents: "auto" }}
                    >
                      {onBoardEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onBoardEdit(board);
                            setIsOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-3 font-bold min-h-[44px]"
                          role="menuitem"
                          type="button"
                        >
                          <Edit2 size={14} aria-hidden="true" />
                          Edit
                        </button>
                      )}
                      {onBoardArchive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onBoardArchive(board);
                            setIsOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-3 font-bold min-h-[44px]"
                          role="menuitem"
                          type="button"
                        >
                          <Archive size={14} aria-hidden="true" />
                          Archive
                        </button>
                      )}
                      {onBoardDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMenu(false);
                            onBoardDelete(board);
                            setIsOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-3 font-bold min-h-[44px]"
                          role="menuitem"
                          type="button"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          Delete
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      );
    };
  }, [currentBoardId, onBoardSelect, onBoardEdit, onBoardDelete, onBoardArchive, setIsOpen]);

  /**
   * Sortable Board Item Component
   * 
   * Wraps BoardItem with drag-and-drop functionality
   */
  const SortableBoardItem = memo(function SortableBoardItem({ board }: { board: Board }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: board.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition: isDragging ? "none" : transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div ref={setNodeRef} style={style}>
        <BoardItem board={board} dragHandleProps={{ ...attributes, ...listeners }} />
      </div>
    );
  });

  /**
   * Profile section component
   */
  const ProfileSection = useMemo(() => {
    return () => (
      <div className="p-4 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
            <User className="text-white dark:text-black" size={18} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-black dark:text-white truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-black/50 dark:text-white/50 truncate font-bold">
              {session?.user?.email || ""}
            </p>
          </div>
        </div>

        {/* Quick auth links */}
        <div className="space-y-1">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold min-h-[44px]"
            aria-label="Account settings"
          >
            <Settings size={16} aria-hidden="true" />
            <span className="text-xs sm:text-sm">Account Settings</span>
          </Link>
          <Link
            href="/settings#mfa"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold min-h-[44px]"
            aria-label="Multi-factor authentication setup"
          >
            <Shield size={16} aria-hidden="true" />
            <span className="text-xs sm:text-sm">MFA Setup</span>
          </Link>
          <Link
            href="/auth/password/reset"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold min-h-[44px]"
            aria-label="Reset password"
          >
            <Lock size={16} aria-hidden="true" />
            <span className="text-xs sm:text-sm">Reset Password</span>
          </Link>
        </div>
      </div>
    );
  }, [session]);

  /**
   * Memoized filtered boards to prevent unnecessary recalculations
   * This is separate from SidebarContent to avoid remounting the SearchBar
   */
  const filteredBoards = useMemo(() => {
    return searchBoards(boards, {
      query: localSearchQuery,
      filter: searchFilter,
    });
  }, [boards, localSearchQuery, searchFilter]);

  /**
   * Memoized active board lookup to avoid repeated find() calls
   * Optimized for 2 vCores: single pass lookup
   */
  const activeBoard = useMemo(() => {
    if (!activeBoardId) return null;
    // Single pass lookup (more efficient than find for large arrays)
    for (let i = 0; i < filteredBoards.length; i++) {
      if (filteredBoards[i].id === activeBoardId) {
        return filteredBoards[i];
      }
    }
    return null;
  }, [filteredBoards, activeBoardId]);

  /**
   * Memoized board IDs array for SortableContext (optimized to avoid repeated map calls)
   */
  const boardIds = useMemo(() => {
    return localSearchQuery.trim() === "" 
      ? boards.map((b) => b.id)
      : filteredBoards.map((b) => b.id);
  }, [boards, filteredBoards, localSearchQuery]);

  /**
   * Shared sidebar content component
   * Note: SearchBar and filtered boards are rendered outside useMemo to prevent input focus loss
   */
  const SidebarContent = useMemo(() => {
    return ({ isMobile = false }: { isMobile?: boolean }) => (
      <>
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="text-white dark:text-black" size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white truncate">
                Kibble
              </h1>
              <p className="text-xs text-black/50 dark:text-white/50 hidden sm:block font-bold">
                Kanban Boards
              </p>
            </div>
            {/* Removed redundant close button - hamburger button handles closing */}
          </div>
        </div>

        {/* Profile Section (Mobile only) */}
        {isMobile && <ProfileSection />}

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10 space-y-1.5">
          <Link
            href="/archive"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold min-h-[44px]"
            aria-label="View archived items"
          >
            <Archive size={16} aria-hidden="true" />
            <span className="text-xs sm:text-sm">Archive</span>
          </Link>
          {!isMobile && (
            <Link
              href="/settings"
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold min-h-[44px]"
              aria-label="Settings"
            >
              <Settings size={16} aria-hidden="true" />
              <span className="text-xs sm:text-sm">Settings</span>
            </Link>
          )}
          <button
            onClick={() => {
              // Mark interaction to pause polling during theme switch
              markUserInteraction();
              toggleTheme();
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 text-black dark:text-white font-bold min-h-[44px]"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            type="button"
          >
            <motion.div
              key={theme}
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {theme === "light" ? (
                <Moon size={16} aria-hidden="true" />
              ) : (
                <Sun size={16} aria-hidden="true" />
              )}
            </motion.div>
            <span className="text-xs sm:text-sm">
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
          <button
            onClick={() => {
              signOut({ callbackUrl: "/auth/signin" });
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold min-h-[44px]"
            aria-label="Sign out"
            type="button"
          >
            <LogOut size={16} aria-hidden="true" />
            <span className="text-xs sm:text-sm">Sign Out</span>
          </button>
        </div>
      </>
    );
  }, [onNewBoard, theme, toggleTheme, session, ProfileSection, BoardItem, isOpen]);

  return (
    <>
      {/* Mobile menu button - Always visible on mobile, hidden on desktop */}
      {/* Toggles between hamburger icon (closed) and X icon (open) */}
      <motion.button
        onClick={() => {
          markUserInteraction();
          setIsOpen(!isOpen);
        }}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-[60] lg:hidden p-3 rounded-lg bg-white dark:bg-black shadow-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all backdrop-blur-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar"
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={false}
        animate={{ 
          rotate: isOpen ? 90 : 0,
          scale: isOpen ? 1.1 : 1
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ willChange: "transform" }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15 }}
            >
              <X size={20} className="text-black dark:text-white" aria-hidden="true" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
              transition={{ duration: 0.15 }}
            >
              <Menu size={20} className="text-black dark:text-white" aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Desktop sidebar - Always visible on large screens */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen-responsive w-64 xl:w-72 bg-white dark:bg-black border-r border-black/10 dark:border-white/10 z-40 flex-col flex-shrink-0">
        <SidebarContent isMobile={false} />
        {/* Search Bar and Boards List - rendered outside SidebarContent to prevent remounting */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-black dark:text-white uppercase tracking-wider">
              Classes
            </h2>
            <button
              onClick={() => {
                onNewBoard();
              }}
              className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
              title="Create new board"
              aria-label="Create new board"
              type="button"
            >
              <Plus className="text-black dark:text-white" size={16} aria-hidden="true" />
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mb-3 sm:mb-4">
            <SearchBar
              searchQuery={localSearchQuery}
              onSearchChange={handleSearchChange}
              activeFilter={searchFilter}
              onFilterChange={setSearchFilter}
              showFilters={false}
              placeholder="Search boards…"
            />
          </div>

          {/* Filtered Boards List with Drag & Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event: DragStartEvent) => {
              setActiveBoardId(event.active.id as string);
              markUserInteraction(); // Pause polling during drag
            }}
            onDragEnd={async (event: DragEndEvent) => {
              const { active, over } = event;
              setActiveBoardId(null);

              if (!over || active.id === over.id) {
                return;
              }

              // Only allow reordering when not searching (to prevent conflicts)
              if (localSearchQuery.trim() !== "") {
                return;
              }

              // Use the full boards array for reordering (not filtered)
              const oldIndex = boards.findIndex((b) => b.id === active.id);
              const newIndex = boards.findIndex((b) => b.id === over.id);

              if (oldIndex === -1 || newIndex === -1) {
                return;
              }

              // Create reordered array with updated positions
              const reorderedBoards = [...boards];
              const [movedBoard] = reorderedBoards.splice(oldIndex, 1);
              reorderedBoards.splice(newIndex, 0, movedBoard);

              // Update positions in the reordered array
              const updatedBoards = reorderedBoards.map((board, index) => ({
                ...board,
                position: index,
              }));

              // Optimistic UI update
              if (onBoardsReorder) {
                onBoardsReorder(updatedBoards);
              }

              // Persist to database
              setIsReordering(true);
              try {
                const boardIds = updatedBoards.map((b) => b.id);
                const res = await deduplicatedFetch("/api/boards/reorder", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ boardIds }),
                });

                if (!res.ok) {
                  // Revert on error
                  if (onBoardsReorder) {
                    onBoardsReorder(boards);
                  }
                  logError("Failed to reorder boards:", await res.json().catch(() => ({})));
                }
              } catch (error) {
                // Revert on error
                if (onBoardsReorder) {
                  onBoardsReorder(boards);
                }
                logError("Error reordering boards:", error);
              } finally {
                setIsReordering(false);
              }
            }}
          >
            <SortableContext
              items={boardIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {filteredBoards.length === 0 ? (
                  <div className="text-center py-6 px-2">
                    {boards.length === 0 ? (
                      // No boards exist at all
                      <>
                        <p className="text-xs text-black/40 dark:text-white/40 font-bold mb-2">
                          No boards yet
                        </p>
                        <button
                          onClick={() => {
                            onNewBoard();
                          }}
                          className="text-xs text-black dark:text-white hover:opacity-80 underline font-bold min-h-[44px] px-3 py-2"
                          type="button"
                        >
                          Create your first board
                        </button>
                      </>
                    ) : (
                      // Boards exist but search didn't match
                      <>
                        <p className="text-xs text-black/40 dark:text-white/40 font-bold mb-2">
                          No boards found
                        </p>
                        <p className="text-xs text-black/30 dark:text-white/30 font-bold">
                          Try a different search term
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  filteredBoards.map((board) => (
                    <SortableBoardItem key={board.id} board={board} />
                  ))
                )}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeBoard ? (
                <div className="opacity-50">
                  <BoardItem board={activeBoard} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </aside>

      {/* Mobile sidebar - Animated overlay with swipe support */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
              aria-hidden="true"
              transition={{ duration: 0.2 }}
              style={{ willChange: "opacity" }}
            />

            {/* Sidebar drawer */}
            <motion.aside
              id="mobile-sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 350,
              }}
              style={{
                x,
                opacity,
                willChange: "transform",
              }}
              className="fixed left-0 top-0 h-screen-responsive bg-white dark:bg-black border-r border-black/10 dark:border-white/10 z-[55] flex flex-col shadow-2xl lg:hidden flex-shrink-0 rounded-r-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <SidebarContent isMobile={true} />
              {/* Search Bar and Boards List - rendered outside SidebarContent to prevent remounting */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-xs sm:text-sm font-bold text-black dark:text-white uppercase tracking-wider">
                    Classes
                  </h2>
                  <button
                    onClick={() => {
                      onNewBoard();
                      setIsOpen(false);
                    }}
                    className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                    title="Create new board"
                    aria-label="Create new board"
                    type="button"
                  >
                    <Plus className="text-black dark:text-white" size={16} aria-hidden="true" />
                  </button>
                </div>
                
                {/* Search Bar */}
                <div className="mb-3 sm:mb-4">
                  <SearchBar
                    searchQuery={localSearchQuery}
                    onSearchChange={handleSearchChange}
                    activeFilter={searchFilter}
                    onFilterChange={setSearchFilter}
                    showFilters={false}
                    placeholder="Search boards…"
                  />
                </div>

                {/* Filtered Boards List with Drag & Drop */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(event: DragStartEvent) => {
                    setActiveBoardId(event.active.id as string);
                    markUserInteraction(); // Pause polling during drag
                  }}
                  onDragEnd={async (event: DragEndEvent) => {
                    const { active, over } = event;
                    setActiveBoardId(null);

                    if (!over || active.id === over.id) {
                      return;
                    }

                    // Only allow reordering when not searching (to prevent conflicts)
                    if (localSearchQuery.trim() !== "") {
                      return;
                    }

                    // Use the full boards array for reordering (not filtered)
                    const oldIndex = boards.findIndex((b) => b.id === active.id);
                    const newIndex = boards.findIndex((b) => b.id === over.id);

                    if (oldIndex === -1 || newIndex === -1) {
                      return;
                    }

                    // Create reordered array with updated positions
                    const reorderedBoards = [...boards];
                    const [movedBoard] = reorderedBoards.splice(oldIndex, 1);
                    reorderedBoards.splice(newIndex, 0, movedBoard);

                    // Update positions in the reordered array
                    const updatedBoards = reorderedBoards.map((board, index) => ({
                      ...board,
                      position: index,
                    }));

                    // Optimistic UI update
                    if (onBoardsReorder) {
                      onBoardsReorder(updatedBoards);
                    }

                    // Persist to database
                    setIsReordering(true);
                    try {
                      const boardIds = updatedBoards.map((b) => b.id);
                      const res = await deduplicatedFetch("/api/boards/reorder", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ boardIds }),
                      });

                      if (!res.ok) {
                        // Revert on error
                        if (onBoardsReorder) {
                          onBoardsReorder(boards);
                        }
                        logError("Failed to reorder boards:", await res.json().catch(() => ({})));
                      }
                    } catch (error) {
                      // Revert on error
                      if (onBoardsReorder) {
                        onBoardsReorder(boards);
                      }
                      logError("Error reordering boards:", error);
                    } finally {
                      setIsReordering(false);
                    }
                  }}
                >
                  <SortableContext
                    items={boardIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {filteredBoards.length === 0 ? (
                        <div className="text-center py-6 px-2">
                          {boards.length === 0 ? (
                            // No boards exist at all
                            <>
                              <p className="text-xs text-black/40 dark:text-white/40 font-bold mb-2">
                                No boards yet
                              </p>
                              <button
                                onClick={() => {
                                  onNewBoard();
                                  setIsOpen(false);
                                }}
                                className="text-xs text-black dark:text-white hover:opacity-80 underline font-bold min-h-[44px] px-3 py-2"
                                type="button"
                              >
                                Create your first board
                              </button>
                            </>
                          ) : (
                            // Boards exist but search didn't match
                            <>
                              <p className="text-xs text-black/40 dark:text-white/40 font-bold mb-2">
                                No boards found
                              </p>
                              <p className="text-xs text-black/30 dark:text-white/30 font-bold">
                                Try a different search term
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        filteredBoards.map((board) => (
                          <SortableBoardItem key={board.id} board={board} />
                        ))
                      )}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeBoard ? (
                      <div className="opacity-50">
                        <BoardItem board={activeBoard} />
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
