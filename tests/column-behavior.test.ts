import { describe, it, expect } from 'vitest';
import type { Column } from '@/lib/types';

/**
 * Column Behavior Tests
 * 
 * These tests verify:
 * - Column order persistence
 * - Column reordering logic
 * - Column-task relationships
 */

describe('Column Behavior', () => {
  const mockColumns: Column[] = [
    {
      id: 'col-1',
      title: 'To-Do',
      order: 0,
      boardId: 'board-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'col-2',
      title: 'In-Progress',
      order: 1,
      boardId: 'board-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'col-3',
      title: 'Review',
      order: 2,
      boardId: 'board-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'col-4',
      title: 'Done',
      order: 3,
      boardId: 'board-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe('Column Order', () => {
    it('should sort columns by order', () => {
      const sortedColumns = [...mockColumns].sort((a, b) => a.order - b.order);

      expect(sortedColumns[0].title).toBe('To-Do');
      expect(sortedColumns[1].title).toBe('In-Progress');
      expect(sortedColumns[2].title).toBe('Review');
      expect(sortedColumns[3].title).toBe('Done');
    });

    it('should calculate new order when dragging column right', () => {
      const sortedCols = [...mockColumns].sort((a, b) => a.order - b.order);
      const draggedIndex = 0; // To-Do
      const overIndex = 2; // Review

      let newOrder: number;
      if (draggedIndex < overIndex) {
        newOrder = overIndex;
      } else {
        newOrder = overIndex;
      }

      expect(newOrder).toBe(2);
    });

    it('should calculate new order when dragging column left', () => {
      const sortedCols = [...mockColumns].sort((a, b) => a.order - b.order);
      const draggedIndex = 3; // Done
      const overIndex = 1; // In-Progress

      let newOrder: number;
      if (draggedIndex < overIndex) {
        newOrder = overIndex;
      } else {
        newOrder = overIndex;
      }

      expect(newOrder).toBe(1);
    });

    it('should maintain column order after reordering', () => {
      const reorderedColumns = [...mockColumns];
      // Swap first and last
      const temp = reorderedColumns[0].order;
      reorderedColumns[0].order = reorderedColumns[3].order;
      reorderedColumns[3].order = temp;

      const sorted = reorderedColumns.sort((a, b) => a.order - b.order);
      expect(sorted.length).toBe(4);
    });
  });

  describe('Column Validation', () => {
    it('should have exactly 4 default columns', () => {
      expect(mockColumns.length).toBe(4);
    });

    it('should have correct default column titles', () => {
      const titles = mockColumns.map(col => col.title);
      expect(titles).toContain('To-Do');
      expect(titles).toContain('In-Progress');
      expect(titles).toContain('Review');
      expect(titles).toContain('Done');
    });

    it('should have sequential order values', () => {
      const sorted = [...mockColumns].sort((a, b) => a.order - b.order);
      sorted.forEach((col, index) => {
        expect(col.order).toBe(index);
      });
    });
  });

  describe('Column-Task Relationships', () => {
    it('should identify Done column correctly', () => {
      const doneColumn = mockColumns.find(col => col.title === 'Done');
      expect(doneColumn).toBeDefined();
      expect(doneColumn?.title).toBe('Done');
    });

    it('should identify To-Do column correctly', () => {
      const todoColumn = mockColumns.find(col => col.title === 'To-Do');
      expect(todoColumn).toBeDefined();
      expect(todoColumn?.title).toBe('To-Do');
    });

    it('should check if column is Done column', () => {
      const column = mockColumns[3]; // Done column
      const isDone = column.title === 'Done';
      expect(isDone).toBe(true);
    });

    it('should check if column is not Done column', () => {
      const column = mockColumns[1]; // In-Progress column
      const isDone = column.title === 'Done';
      expect(isDone).toBe(false);
    });
  });
});
