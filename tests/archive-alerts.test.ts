import { describe, it, expect } from 'vitest';
import { checkTaskAlert } from '@/lib/alert-utils';
import type { Task } from '@/lib/types';

/**
 * Test Suite for Archive Alerts Feature
 * 
 * Tests that archived tasks and tasks in archived boards don't show due date alerts.
 */

describe('Archive Alerts Feature', () => {
  describe('checkTaskAlert with archived tasks', () => {
    it('should not generate alert for archived task', () => {
      const archivedTask: Task = {
        id: 'task-1',
        title: 'Archived Task',
        description: null,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        order: 0,
        columnId: 'col-1',
        locked: false,
        archived: true, // Task is archived
        movedToDoneAt: null,
        archivedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Task;

      const alert = checkTaskAlert(archivedTask);
      expect(alert).toBeNull();
    });

    it('should not generate alert for task in archived board', () => {
      const taskInArchivedBoard: Task = {
        id: 'task-2',
        title: 'Task in Archived Board',
        description: null,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        order: 0,
        columnId: 'col-1',
        locked: false,
        archived: false,
        movedToDoneAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        column: {
          id: 'col-1',
          title: 'To-Do',
          order: 0,
          boardId: 'board-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          board: {
            id: 'board-1',
            title: 'Archived Board',
            userId: 'user-1',
            archived: true, // Board is archived
            archivedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      } as Task;

      const alert = checkTaskAlert(taskInArchivedBoard);
      expect(alert).toBeNull();
    });

    it('should generate alert for non-archived task in non-archived board', () => {
      const normalTask: Task = {
        id: 'task-3',
        title: 'Normal Task',
        description: null,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        order: 0,
        columnId: 'col-1',
        locked: false,
        archived: false,
        movedToDoneAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        column: {
          id: 'col-1',
          title: 'To-Do',
          order: 0,
          boardId: 'board-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          board: {
            id: 'board-1',
            title: 'Active Board',
            userId: 'user-1',
            archived: false, // Board is not archived
            archivedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      } as Task;

      const alert = checkTaskAlert(normalTask);
      expect(alert).not.toBeNull();
      expect(alert?.taskId).toBe('task-3');
      expect(alert?.taskTitle).toBe('Normal Task');
    });

    it('should handle task without column.board gracefully', () => {
      const taskWithoutBoard: Task = {
        id: 'task-4',
        title: 'Task Without Board',
        description: null,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        order: 0,
        columnId: 'col-1',
        locked: false,
        archived: false,
        movedToDoneAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        // column.board is undefined
      } as Task;

      // Should not crash, but may or may not generate alert depending on implementation
      const alert = checkTaskAlert(taskWithoutBoard);
      // If column.board is undefined, we can't check if board is archived
      // So it should still check the task's archived status
      if (alert) {
        expect(alert.taskId).toBe('task-4');
      }
    });

    it('should handle task with null column gracefully', () => {
      const taskWithNullColumn: Task = {
        id: 'task-5',
        title: 'Task With Null Column',
        description: null,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        order: 0,
        columnId: 'col-1',
        locked: false,
        archived: false,
        movedToDoneAt: null,
        archivedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        column: null as any,
      } as Task;

      // Should not crash
      const alert = checkTaskAlert(taskWithNullColumn);
      // Should handle null column gracefully
      if (alert) {
        expect(alert.taskId).toBe('task-5');
      }
    });
  });
});
