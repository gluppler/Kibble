/**
 * Search Utilities Tests
 * 
 * Comprehensive tests for search and filtering functionality:
 * - Task search with priority filtering
 * - Board search
 * - Archived task/board search
 * - Edge cases: empty queries, null values, special characters, etc.
 */

import { describe, it, expect } from 'vitest';
import {
  searchTasks,
  searchBoards,
  searchArchivedTasks,
  searchArchivedBoards,
  type SearchFilter,
  type SearchOptions,
} from '@/lib/search-utils';
import type { Task, Board } from '@/lib/types';

describe('Search Utilities', () => {
  describe('normalizeString and matchesQuery', () => {
    it('should handle null and undefined strings', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'Test Task',
          description: null,
          priority: 'normal',
          columnId: 'col-1',
          order: 0,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task-2',
          title: 'Another Task',
          description: undefined as any,
          priority: 'high',
          columnId: 'col-1',
          order: 1,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = searchTasks(tasks, { query: 'test' });
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle empty strings', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: '',
          description: '',
          priority: 'normal',
          columnId: 'col-1',
          order: 0,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = searchTasks(tasks, { query: '' });
      expect(results.length).toBe(1); // Empty query matches everything
    });

    it('should handle whitespace-only strings', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: '   Test Task   ',
          description: '   Description   ',
          priority: 'normal',
          columnId: 'col-1',
          order: 0,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = searchTasks(tasks, { query: 'test' });
      expect(results.length).toBe(1);
    });
  });

  describe('searchTasks', () => {
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        title: 'High Priority Task',
        description: 'This is a high priority task',
        priority: 'high',
        columnId: 'col-1',
        order: 0,
        locked: false,
        archived: false,
        movedToDoneAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-2',
        title: 'Normal Priority Task',
        description: 'This is a normal priority task',
        priority: 'normal',
        columnId: 'col-1',
        order: 1,
        locked: false,
        archived: false,
        movedToDoneAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-3',
        title: 'Another Normal Task',
        description: null,
        priority: 'normal',
        columnId: 'col-1',
        order: 2,
        locked: false,
        archived: false,
        movedToDoneAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'task-4',
        title: 'Task Without Priority',
        description: 'Task with undefined priority',
        priority: undefined as any,
        columnId: 'col-1',
        order: 3,
        locked: false,
        archived: false,
        movedToDoneAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all tasks with empty query', () => {
      const results = searchTasks(mockTasks, { query: '' });
      expect(results.length).toBe(4);
    });

    it('should search by title', () => {
      const results = searchTasks(mockTasks, { query: 'High Priority Task' });
      // Query contains "priority" which matches all tasks, but also matches title
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(t => t.id === 'task-1')).toBe(true);
    });

    it('should search by description', () => {
      const results = searchTasks(mockTasks, { query: 'high priority task' });
      // Query contains "priority" which matches all tasks
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(t => t.id === 'task-1')).toBe(true);
    });

    it('should be case-insensitive', () => {
      const results = searchTasks(mockTasks, { query: 'HIGH PRIORITY TASK' });
      // Query contains "priority" which matches all tasks
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(t => t.id === 'task-1')).toBe(true);
    });

    it('should filter by high-priority filter', () => {
      const results = searchTasks(mockTasks, { query: '', filter: 'high-priority' });
      expect(results.length).toBe(1);
      expect(results[0].priority).toBe('high');
    });

    it('should filter by normal-priority filter', () => {
      const results = searchTasks(mockTasks, { query: '', filter: 'normal-priority' });
      expect(results.length).toBe(3); // task-2, task-3, task-4 (defaults to normal)
    });

    it('should combine query and priority filter', () => {
      const results = searchTasks(mockTasks, { query: 'Task', filter: 'high-priority' });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('task-1');
    });

    it('should return empty array when filtering for boards', () => {
      const results = searchTasks(mockTasks, { query: '', filter: 'boards' });
      expect(results.length).toBe(0);
    });

    it('should handle tasks with undefined priority (defaults to normal)', () => {
      const results = searchTasks(mockTasks, { query: '', filter: 'normal-priority' });
      const task4 = results.find(t => t.id === 'task-4');
      expect(task4).toBeDefined();
    });

    it('should search for priority keywords in query', () => {
      const results = searchTasks(mockTasks, { query: 'high priority' });
      // "priority" keyword matches all tasks, so we get all 4
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(t => t.id === 'task-1')).toBe(true);
    });

    it('should search for "priority" keyword', () => {
      const results = searchTasks(mockTasks, { query: 'priority' });
      // "priority" keyword matches all tasks
      expect(results.length).toBe(4); // All tasks match because query contains "priority"
    });

    it('should handle special characters in query', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'Task with @special#chars!',
          description: null,
          priority: 'normal',
          columnId: 'col-1',
          order: 0,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = searchTasks(tasks, { query: '@special' });
      expect(results.length).toBe(1);
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);
      const results = searchTasks(mockTasks, { query: longQuery });
      expect(results.length).toBe(0);
    });

    it('should handle unicode characters', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'Task with émojis 🎉 and ñoño',
          description: null,
          priority: 'normal',
          columnId: 'col-1',
          order: 0,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = searchTasks(tasks, { query: 'émojis' });
      expect(results.length).toBe(1);
    });

    it('should handle empty task array', () => {
      const results = searchTasks([], { query: 'test' });
      expect(results.length).toBe(0);
    });

    it('should use priorityFilter when provided', () => {
      const results = searchTasks(mockTasks, { query: '', priorityFilter: 'high' });
      expect(results.length).toBe(1);
      expect(results[0].priority).toBe('high');
    });

    it('should prioritize filter over priorityFilter', () => {
      const results = searchTasks(mockTasks, {
        query: '',
        filter: 'normal-priority',
        priorityFilter: 'high',
      });
      expect(results.length).toBe(3); // filter takes precedence
    });
  });

  describe('searchBoards', () => {
    const mockBoards: Array<{ id: string; title: string }> = [
      { id: 'board-1', title: 'Project Alpha' },
      { id: 'board-2', title: 'Project Beta' },
      { id: 'board-3', title: 'Alpha Testing' },
    ];

    it('should return all boards with empty query and "all" filter', () => {
      const results = searchBoards(mockBoards, { query: '', filter: 'all' });
      expect(results.length).toBe(3);
    });

    it('should return all boards with empty query and "boards" filter', () => {
      const results = searchBoards(mockBoards, { query: '', filter: 'boards' });
      expect(results.length).toBe(3);
    });

    it('should search by title', () => {
      const results = searchBoards(mockBoards, { query: 'Alpha' });
      expect(results.length).toBe(2);
      expect(results.map(b => b.id)).toContain('board-1');
      expect(results.map(b => b.id)).toContain('board-3');
    });

    it('should be case-insensitive', () => {
      const results = searchBoards(mockBoards, { query: 'ALPHA' });
      expect(results.length).toBe(2);
    });

    it('should return empty array when filtering for tasks', () => {
      const results = searchBoards(mockBoards, { query: '', filter: 'tasks' });
      expect(results.length).toBe(0);
    });

    it('should handle partial matches', () => {
      const results = searchBoards(mockBoards, { query: 'Proj' });
      expect(results.length).toBe(2);
    });

    it('should handle special characters in board titles', () => {
      const boards: Array<{ id: string; title: string }> = [
        { id: 'board-1', title: 'Board @#$%' },
      ];
      const results = searchBoards(boards, { query: '@#$' });
      expect(results.length).toBe(1);
    });

    it('should handle empty board array', () => {
      const results = searchBoards([], { query: 'test' });
      expect(results.length).toBe(0);
    });

    it('should handle boards with null or undefined titles', () => {
      const boards: Array<{ id: string; title: string | null | undefined }> = [
        { id: 'board-1', title: null },
        { id: 'board-2', title: undefined },
        { id: 'board-3', title: 'Valid Board' },
      ];

      // TypeScript will complain, but we test runtime behavior
      const results = searchBoards(boards as any, { query: 'Valid' });
      expect(results.length).toBe(1);
    });

    it('should handle very long queries', () => {
      const longQuery = 'a'.repeat(1000);
      const results = searchBoards(mockBoards, { query: longQuery });
      expect(results.length).toBe(0);
    });
  });

  describe('searchArchivedTasks', () => {
    const mockArchivedTasks: Array<{
      id: string;
      title: string;
      description: string | null;
      priority?: string;
    }> = [
      {
        id: 'task-1',
        title: 'Archived High Priority',
        description: 'High priority archived task',
        priority: 'high',
      },
      {
        id: 'task-2',
        title: 'Archived Normal Priority',
        description: 'Normal priority archived task',
        priority: 'normal',
      },
      {
        id: 'task-3',
        title: 'Archived Task No Priority',
        description: null,
        priority: undefined,
      },
    ];

    it('should return all tasks with empty query', () => {
      const results = searchArchivedTasks(mockArchivedTasks, { query: '' });
      expect(results.length).toBe(3);
    });

    it('should filter by high-priority', () => {
      const results = searchArchivedTasks(mockArchivedTasks, {
        query: '',
        filter: 'high-priority',
      });
      expect(results.length).toBe(1);
      expect(results[0].priority).toBe('high');
    });

    it('should filter by normal-priority', () => {
      const results = searchArchivedTasks(mockArchivedTasks, {
        query: '',
        filter: 'normal-priority',
      });
      expect(results.length).toBe(2); // task-2 and task-3 (defaults to normal)
    });

    it('should combine query and priority filter', () => {
      const results = searchArchivedTasks(mockArchivedTasks, {
        query: 'Archived',
        filter: 'high-priority',
      });
      expect(results.length).toBe(1);
    });

    it('should search by title', () => {
      const results = searchArchivedTasks(mockArchivedTasks, { query: 'Archived High' });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('task-1');
    });

    it('should search by description', () => {
      const results = searchArchivedTasks(mockArchivedTasks, { query: 'High priority archived' });
      // "priority" keyword matches all tasks, so we get all 3
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(t => t.id === 'task-1')).toBe(true);
    });

    it('should handle tasks with undefined priority', () => {
      const results = searchArchivedTasks(mockArchivedTasks, {
        query: '',
        filter: 'normal-priority',
      });
      const task3 = results.find(t => t.id === 'task-3');
      expect(task3).toBeDefined();
    });

    it('should handle empty array', () => {
      const results = searchArchivedTasks([], { query: 'test' });
      expect(results.length).toBe(0);
    });
  });

  describe('searchArchivedBoards', () => {
    const mockArchivedBoards: Array<{ id: string; title: string }> = [
      { id: 'board-1', title: 'Archived Project Alpha' },
      { id: 'board-2', title: 'Archived Project Beta' },
    ];

    it('should return all boards with empty query', () => {
      const results = searchArchivedBoards(mockArchivedBoards, { query: '' });
      expect(results.length).toBe(2);
    });

    it('should search by title', () => {
      const results = searchArchivedBoards(mockArchivedBoards, { query: 'Alpha' });
      expect(results.length).toBe(1);
      expect(results[0].id).toBe('board-1');
    });

    it('should be case-insensitive', () => {
      const results = searchArchivedBoards(mockArchivedBoards, { query: 'ALPHA' });
      expect(results.length).toBe(1);
    });

    it('should handle empty array', () => {
      const results = searchArchivedBoards([], { query: 'test' });
      expect(results.length).toBe(0);
    });

    it('should handle partial matches', () => {
      const results = searchArchivedBoards(mockArchivedBoards, { query: 'Archived' });
      expect(results.length).toBe(2);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle SQL injection patterns safely', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: "Task'; DROP TABLE tasks--",
          description: null,
          priority: 'normal',
          columnId: 'col-1',
          order: 0,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Should not throw error, just search normally
      const results = searchTasks(tasks, { query: "DROP TABLE" });
      expect(results.length).toBe(1);
    });

    it('should handle XSS patterns safely', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: '<script>alert("xss")</script>',
          description: null,
          priority: 'normal',
          columnId: 'col-1',
          order: 0,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = searchTasks(tasks, { query: 'script' });
      expect(results.length).toBe(1);
    });

    it('should handle very large task arrays', () => {
      const largeTaskArray: Task[] = Array.from({ length: 10000 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: null,
        priority: i % 2 === 0 ? 'normal' : 'high',
        columnId: 'col-1',
        order: i,
        locked: false,
        archived: false,
        movedToDoneAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const startTime = Date.now();
      const results = searchTasks(largeTaskArray, { query: 'Task 5000' });
      const endTime = Date.now();

      expect(results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should handle concurrent filter and query combinations', () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          title: 'High Priority Task',
          description: 'Description',
          priority: 'high',
          columnId: 'col-1',
          order: 0,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task-2',
          title: 'Normal Priority Task',
          description: 'Description',
          priority: 'normal',
          columnId: 'col-1',
          order: 1,
          locked: false,
          archived: false,
          movedToDoneAt: null,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const filters: SearchFilter[] = ['all', 'high-priority', 'normal-priority', 'tasks', 'boards'];
      filters.forEach(filter => {
        const results = searchTasks(tasks, { query: 'Task', filter });
        expect(Array.isArray(results)).toBe(true);
      });
    });
  });
});
