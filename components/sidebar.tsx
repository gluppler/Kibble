"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/contexts/theme-context";
import { useRouter } from "next/navigation";
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
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();

  // Create a component for each board item
  const BoardItem = ({ board }: { board: Board }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
      <div
        className="group relative"
        onMouseLeave={() => setShowMenu(false)}
      >
        <motion.div
          onClick={() => {
            onBoardSelect(board.id);
            setIsOpen(false);
          }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer font-bold ${
            currentBoardId === board.id
              ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
              : "text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded flex-shrink-0 ${
                currentBoardId === board.id
                  ? "bg-white dark:bg-black"
                  : "bg-black/30 dark:bg-white/30"
              }`}
            />
            <span className="text-xs sm:text-sm truncate flex-1">{board.title}</span>
            {(onBoardEdit || onBoardDelete) && (
              <div className="relative z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowMenu(!showMenu);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`p-1.5 rounded transition-all flex-shrink-0 opacity-100 ${
                    currentBoardId === board.id
                      ? "hover:bg-white/20 dark:hover:bg-black/20"
                      : "hover:bg-black/10 dark:hover:bg-white/10"
                  }`}
                  aria-label="Board options"
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
              </div>
            )}
          </div>
        </motion.div>
        {showMenu && (
          <div className="absolute right-0 top-10 z-50 bg-white dark:bg-black rounded-lg shadow-xl border border-black/10 dark:border-white/10 py-1 min-w-[140px]">
            {onBoardEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onBoardEdit(board);
                }}
                className="w-full text-left px-3 py-2 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-2 font-bold"
                type="button"
              >
                <Edit2 size={14} />
                Edit
              </button>
            )}
            {onBoardArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onBoardArchive(board);
                }}
                className="w-full text-left px-3 py-2 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-2 font-bold"
                type="button"
              >
                <Archive size={14} />
                Archive
              </button>
            )}
            {onBoardDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onBoardDelete(board);
                }}
                className="w-full text-left px-3 py-2 text-xs sm:text-sm text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-2 font-bold"
                type="button"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button - Always visible on mobile, hidden on desktop */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-[60] lg:hidden p-2.5 rounded-lg bg-white dark:bg-black shadow-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all backdrop-blur-sm"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={false}
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.15 }}
      >
        {isOpen ? <X size={18} className="text-black dark:text-white" /> : <Menu size={18} className="text-black dark:text-white" />}
      </motion.button>

      {/* Desktop sidebar - Always visible on large screens */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen-responsive w-64 xl:w-72 bg-white dark:bg-black border-r border-black/10 dark:border-white/10 z-40 flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="text-white dark:text-black" size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white truncate">
                Kibble
              </h1>
              <p className="text-xs text-black/50 dark:text-white/50 hidden sm:block font-bold">
                Kanban Boards
              </p>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
              <User className="text-white dark:text-black" size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-black dark:text-white truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-black/50 dark:text-white/50 truncate hidden sm:block font-bold">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Boards section */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-black dark:text-white uppercase tracking-wider">
              Classes
            </h2>
            <button
              onClick={onNewBoard}
              className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group flex-shrink-0"
              title="Create new board"
              type="button"
            >
              <Plus
                className="text-black dark:text-white"
                size={16}
              />
            </button>
          </div>

          <div className="space-y-1">
            {boards.length === 0 ? (
              <div className="text-center py-6 px-2">
                <p className="text-xs text-black/40 dark:text-white/40 font-bold mb-2">No boards yet</p>
                <button
                  onClick={onNewBoard}
                  className="text-xs text-black dark:text-white hover:opacity-80 underline font-bold"
                  type="button"
                >
                  Create your first board
                </button>
              </div>
            ) : (
              boards.map((board) => (
                <BoardItem key={board.id} board={board} />
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10 space-y-2">
          <Link
            href="/archive"
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold"
          >
            <Archive size={14} />
            <span className="text-xs sm:text-sm">Archive</span>
          </Link>
          <Link
            href="/settings"
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold"
          >
            <Settings size={14} />
            <span className="text-xs sm:text-sm">Settings</span>
          </Link>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold"
            type="button"
          >
            {theme === "light" ? (
              <Moon size={14} />
            ) : (
              <Sun size={14} />
            )}
            <span className="text-xs sm:text-sm">
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold"
            type="button"
          >
            <LogOut size={14} />
            <span className="text-xs sm:text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar - Animated overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            />

            {/* Sidebar content */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-screen-responsive w-64 sm:w-72 bg-white dark:bg-black border-r border-black/10 dark:border-white/10 z-[55] flex flex-col shadow-xl lg:hidden flex-shrink-0"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="text-white dark:text-black" size={18} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold text-black dark:text-white truncate">
                      Kibble
                    </h1>
                    <p className="text-xs text-black/50 dark:text-white/50 hidden sm:block font-bold">
                      Kanban Boards
                    </p>
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
                    <User className="text-white dark:text-black" size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-black dark:text-white truncate">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-black/50 dark:text-white/50 truncate hidden sm:block font-bold">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Boards section */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-xs sm:text-sm font-bold text-black dark:text-white uppercase tracking-wider">
                    Classes
                  </h2>
                  <button
                    onClick={onNewBoard}
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group flex-shrink-0"
                    title="Create new board"
                    type="button"
                  >
                    <Plus
                      className="text-black dark:text-white"
                      size={16}
                    />
                  </button>
                </div>

                <div className="space-y-1">
                  {boards.map((board) => (
                    <BoardItem key={board.id} board={board} />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t border-black/10 dark:border-white/10 space-y-2">
                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold"
                >
                  <Settings size={14} />
                  <span className="text-xs sm:text-sm">Settings</span>
                </Link>
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold"
                  type="button"
                >
                  {theme === "light" ? (
                    <Moon size={14} />
                  ) : (
                    <Sun size={14} />
                  )}
                  <span className="text-xs sm:text-sm">
                    {theme === "light" ? "Dark Mode" : "Light Mode"}
                  </span>
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black dark:text-white font-bold"
                  type="button"
                >
                  <LogOut size={14} />
                  <span className="text-xs sm:text-sm">Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
