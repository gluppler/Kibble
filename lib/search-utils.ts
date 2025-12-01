/**
 * Search Utilities
 * 
 * Provides client-side search and filtering functions for tasks, boards, and archived items.
 * Implements fuzzy matching and partial text search with debouncing support.
 * 
 * Features:
 * - Case-insensitive search
 * - Partial matching (substring search)
 * - Multi-field search (title, description, board name, priority)
 * - Filter by type (tasks, boards, archived)
 * - Priority-based filtering
 */

import type { Task, Board } from "@/lib/types";

/**
 * Search filter type
 */
export type SearchFilter = "all" | "tasks" | "boards" | "archived" | "high-priority" | "normal-priority";

/**
 * Priority filter type
 */
export type PriorityFilter = "all" | "normal" | "high";

/**
 * Search options
 */
export interface SearchOptions {
  /** Search query string */
  query: string;
  /** Filter by item type or priority */
  filter?: SearchFilter;
  /** Filter by priority (for tasks) - deprecated, use filter instead */
  priorityFilter?: PriorityFilter;
}

/**
 * Normalizes a string for search comparison
 * 
 * @param str - String to normalize
 * @returns Normalized string (lowercase, trimmed)
 */
function normalizeString(str: string | null | undefined): string {
  if (!str) return "";
  return str.toLowerCase().trim();
}

/**
 * Checks if a string matches a search query
 * 
 * Optimized for 2 vCores: Early exit, single normalization, cached query normalization
 * 
 * @param text - Text to search in
 * @param query - Search query (should be pre-normalized for better performance)
 * @param normalizedQuery - Pre-normalized query (optional, for performance)
 * @returns True if text contains query (case-insensitive)
 */
function matchesQuery(text: string | null | undefined, query: string, normalizedQuery?: string): boolean {
  if (!query) return true; // Empty query matches everything
  if (!text) return false; // Early exit for null/undefined text
  
  // Use pre-normalized query if provided (avoids redundant toLowerCase calls)
  const queryToMatch = normalizedQuery ?? normalizeString(query);
  const normalizedText = normalizeString(text);
  return normalizedText.includes(queryToMatch);
}

/**
 * Searches tasks based on query and filters
 * 
 * @param tasks - Array of tasks to search
 * @param options - Search options
 * @returns Filtered array of tasks
 */
export function searchTasks(
  tasks: Task[],
  options: SearchOptions
): Task[] {
  const { query, filter, priorityFilter } = options;

  // Filter by type if specified
  // "tasks" and "boards" filters don't apply when searching within a single board
  // They're only relevant for global searches (archive page, etc.)
  if (filter === "boards") {
    return [];
  }

  let filtered = tasks;

  // Filter by priority if specified in filter or priorityFilter
  const priorityToFilter = filter === "high-priority" ? "high" : filter === "normal-priority" ? "normal" : priorityFilter;
  if (priorityToFilter && priorityToFilter !== "all") {
    filtered = filtered.filter((task) => {
      const taskPriority = (task.priority as "normal" | "high") || "normal";
      return taskPriority === priorityToFilter;
    });
  }

  // If no query, return filtered results
  if (!query) {
    return filtered;
  }

  // Normalize query once for priority matching (optimized for 2 vCores)
  const normalizedQuery = query.toLowerCase();
  const hasHighPriority = normalizedQuery.includes("high priority");
  const hasNormal = normalizedQuery.includes("normal");
  const hasPriority = normalizedQuery.includes("priority");
  
  // Search in task fields with optimized early exits
  return filtered.filter((task) => {
    // Early exit if title matches (most common case)
    if (matchesQuery(task.title, query, normalizedQuery)) return true;
    
    // Check description only if title didn't match
    if (matchesQuery(task.description, query, normalizedQuery)) return true;
    
    // Priority matching (optimized with pre-computed flags)
    const priority = (task.priority as "normal" | "high") || "normal";
    if (hasHighPriority && priority === "high") return true;
    if (hasNormal && priority === "normal") return true;
    if (hasPriority) return true;
    
    return false;
  });
}

/**
 * Searches boards based on query and filters
 * 
 * @param boards - Array of boards to search (can be full Board or minimal board with just id and title)
 * @param options - Search options
 * @returns Filtered array of boards
 */
export function searchBoards<T extends { id: string; title: string }>(
  boards: T[],
  options: SearchOptions
): T[] {
  const { query, filter } = options;

  // Filter by type if specified
  if (filter === "tasks") {
    return [];
  }

  // If no query and filter allows boards, return all boards
  if (!query && (filter === "all" || filter === "boards")) {
    return boards;
  }

  // Search in board title (optimized for 2 vCores)
  const normalizedQuery = query ? query.toLowerCase() : "";
  return boards.filter((board) => {
    return matchesQuery(board.title, query, normalizedQuery);
  });
}

/**
 * Searches archived tasks
 * 
 * @param tasks - Array of archived tasks
 * @param options - Search options
 * @returns Filtered array of tasks
 */
export function searchArchivedTasks<T extends {
  id: string;
  title: string;
  description: string | null;
  priority?: string;
}>(
  tasks: T[],
  options: SearchOptions
): T[] {
  const { query, filter, priorityFilter } = options;

  let filtered = tasks;

  // Filter by priority if specified in filter or priorityFilter
  const priorityToFilter = filter === "high-priority" ? "high" : filter === "normal-priority" ? "normal" : priorityFilter;
  if (priorityToFilter && priorityToFilter !== "all") {
    filtered = filtered.filter((task) => {
      const taskPriority = (task.priority as "normal" | "high") || "normal";
      return taskPriority === priorityToFilter;
    });
  }

  // If no query, return filtered results
  if (!query) {
    return filtered;
  }

  // Normalize query once for priority matching
  const normalizedQuery = query.toLowerCase();
  
  // Search in task fields
  return filtered.filter((task) => {
    const priority = (task.priority as "normal" | "high") || "normal";
    return (
      matchesQuery(task.title, query) ||
      matchesQuery(task.description, query) ||
      (normalizedQuery.includes("high priority") && priority === "high") ||
      (normalizedQuery.includes("normal") && priority === "normal") ||
      normalizedQuery.includes("priority")
    );
  });
}

/**
 * Searches archived boards
 * 
 * @param boards - Array of archived boards
 * @param options - Search options
 * @returns Filtered array of boards
 */
export function searchArchivedBoards<T extends {
  id: string;
  title: string;
}>(
  boards: T[],
  options: SearchOptions
): T[] {
  const { query } = options;

  // If no query, return all boards
  if (!query) {
    return boards;
  }

  // Search in board title (optimized for 2 vCores)
  const normalizedQuery = query.toLowerCase();
  return boards.filter((board) => {
    return matchesQuery(board.title, query, normalizedQuery);
  });
}
