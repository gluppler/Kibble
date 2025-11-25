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
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/contexts/theme-context";
import { useRouter } from "next/navigation";

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
}

export function Sidebar({
  boards,
  currentBoardId,
  onBoardSelect,
  onNewBoard,
  onBoardEdit,
  onBoardDelete,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();

  // Create a component for each board item to manage its own menu state
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
          className={`w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
            currentBoardId === board.id
              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium shadow-sm"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                currentBoardId === board.id
                  ? "bg-blue-600 dark:bg-blue-400"
                  : "bg-gray-400 dark:bg-gray-500"
              }`}
            />
            <span className="text-sm truncate flex-1">{board.title}</span>
            {(onBoardEdit || onBoardDelete) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-opacity flex-shrink-0"
                aria-label="Board options"
                type="button"
              >
                <MoreVertical size={14} className="text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        </motion.div>
        {showMenu && (
          <div className="absolute right-0 top-10 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[120px]">
            {onBoardEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onBoardEdit(board);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                type="button"
              >
                <Edit2 size={14} />
                Edit
              </button>
            )}
            {onBoardDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onBoardDelete(board);
                }}
                className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
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
        className="fixed top-3 left-3 sm:top-4 sm:left-4 z-[60] lg:hidden p-2.5 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all backdrop-blur-sm"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={false}
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </motion.button>

      {/* Desktop sidebar - Always visible on large screens */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 xl:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 flex-col shadow-sm">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <LayoutDashboard className="text-white" size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                Kibble
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Kanban Boards
              </p>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
              <User className="text-white" size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Boards section */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Classes
            </h2>
            <button
              onClick={onNewBoard}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group flex-shrink-0"
              title="Create new board"
              type="button"
            >
              <Plus
                className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
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
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            type="button"
          >
            {theme === "light" ? (
              <Moon size={16} />
            ) : (
              <Sun size={16} />
            )}
            <span className="text-xs sm:text-sm">
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
            type="button"
          >
            <LogOut size={16} />
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
              className="fixed left-0 top-0 h-full w-64 sm:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-[55] flex flex-col shadow-xl lg:hidden"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <LayoutDashboard className="text-white" size={18} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                      Kibble
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                      Kanban Boards
                    </p>
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                    <User className="text-white" size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Boards section */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Classes
                  </h2>
                  <button
                    onClick={onNewBoard}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group flex-shrink-0"
                    title="Create new board"
                    type="button"
                  >
                    <Plus
                      className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"
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
              <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                  type="button"
                >
                  {theme === "light" ? (
                    <Moon size={16} />
                  ) : (
                    <Sun size={16} />
                  )}
                  <span className="text-xs sm:text-sm">
                    {theme === "light" ? "Dark Mode" : "Light Mode"}
                  </span>
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                  type="button"
                >
                  <LogOut size={16} />
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
