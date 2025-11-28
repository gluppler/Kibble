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

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import Link from "next/link";

interface Board {
  id: string;
  title: string;
}

interface SidebarProps {
  boards: Board[];
  currentBoardId: string | null;
  onBoardSelect: (boardId: string) => void;
  onNewBoard: () => void;
  onBoardEdit?: (board: Board) => void;
  onBoardDelete?: (board: Board) => void;
  onBoardArchive?: (board: Board) => void;
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
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState(""); // For real-time filtering
  const [searchFilter, setSearchFilter] = useState<SearchFilter>("all");
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();

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
    return ({ board }: { board: Board }) => {
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
        <div className="group relative">
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
            <div className="flex items-center gap-2 min-h-[44px]">
              <div
                className={`w-2 h-2 rounded flex-shrink-0 ${
                  currentBoardId === board.id
                    ? "bg-white dark:bg-black"
                    : "bg-black/30 dark:bg-white/30"
                }`}
                aria-hidden="true"
              />
              <span className="text-xs sm:text-sm truncate flex-1 leading-tight">
                {board.title}
              </span>
              {(onBoardEdit || onBoardDelete || onBoardArchive) && (
                <div className="relative z-10 flex-shrink-0" ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowMenu(!showMenu);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`p-2 rounded transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                      currentBoardId === board.id
                        ? "hover:bg-white/20 dark:hover:bg-black/20"
                        : "hover:bg-black/10 dark:hover:bg-white/10"
                    }`}
                    aria-label="Board options"
                    aria-expanded={showMenu}
                    aria-haspopup="true"
                    type="button"
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
                      className="absolute right-0 top-12 z-50 bg-white dark:bg-black rounded-lg shadow-xl border border-black/10 dark:border-white/10 py-1 min-w-[160px]"
                      role="menu"
                      aria-orientation="vertical"
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
  }, [currentBoardId, onBoardSelect, onBoardEdit, onBoardDelete, onBoardArchive]);

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
            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                aria-label="Close menu"
                type="button"
              >
                <X size={18} className="text-black dark:text-white" aria-hidden="true" />
              </button>
            )}
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
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold min-h-[44px]"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            type="button"
          >
            {theme === "light" ? (
              <Moon size={16} aria-hidden="true" />
            ) : (
              <Sun size={16} aria-hidden="true" />
            )}
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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-[60] lg:hidden p-3 rounded-lg bg-white dark:bg-black shadow-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all backdrop-blur-sm min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-sidebar"
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={false}
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        style={{ willChange: "transform" }} // GPU acceleration
      >
        {isOpen ? (
          <X size={18} className="text-black dark:text-white" aria-hidden="true" />
        ) : (
          <Menu size={18} className="text-black dark:text-white" aria-hidden="true" />
        )}
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

          {/* Filtered Boards List */}
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
                <BoardItem key={board.id} board={board} />
              ))
            )}
          </div>
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
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              aria-hidden="true"
              style={{ willChange: "opacity" }} // GPU acceleration
            />

            {/* Sidebar drawer */}
            <motion.aside
              id="mobile-sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
              style={{
                x,
                opacity,
                willChange: "transform", // GPU acceleration
              }}
              className="fixed left-0 top-0 h-screen-responsive bg-white dark:bg-black border-r border-black/10 dark:border-white/10 z-[55] flex flex-col shadow-xl lg:hidden flex-shrink-0 rounded-r-2xl"
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

                {/* Filtered Boards List */}
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
                      <BoardItem key={board.id} board={board} />
                    ))
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
