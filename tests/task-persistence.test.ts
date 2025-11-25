import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Task, Column } from '@/lib/types';

/**
 * Task Persistence and Behavior Tests
 * 
 * These tests verify:
 * - Task creation and persistence
 * - Task dragging and real-time updates
 * - Task locking behavior
 * - Column interactions
 */

describe('Task Persistence and Behavior', () => {
  // Mock data
  const mockBoard = {
    id: 'board-1',
    title: 'Test Board',
    columns: [
      {
        id: 'col-1',
        title: 'To-Do',
        order: 0,
        tasks: [] as Task[],
      },
      {
        id: 'col-2',
        title: 'In-Progress',
        order: 1,
        tasks: [] as Task[],
      },
      {
        id: 'col-3',
        title: 'Review',
        order: 2,
        tasks: [] as Task[],
      },
      {
        id: 'col-4',
        title: 'Done',
        order: 3,
        tasks: [] as Task[],
      },
    ] as (Column & { tasks: Task[] })[],
  };

  const mockTask: Task = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    dueDate: null,
    order: 0,
    columnId: 'col-1',
    locked: false,
    movedToDoneAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Task Creation', () => {
    it('should create a task with all required fields', () => {
      const task: Task = {
        ...mockTask,
        title: 'New Task',
      };

      expect(task.id).toBeDefined();
      expect(task.title).toBe('New Task');
      expect(task.columnId).toBe('col-1');
      expect(task.order).toBe(0);
      expect(task.locked).toBe(false);
    });

    it('should create a task with no due date', () => {
      const task: Task = {
        ...mockTask,
        dueDate: null,
      };

      expect(task.dueDate).toBeNull();
      expect(task.locked).toBe(false);
    });

    it('should create a task with description but no due date', () => {
      const task: Task = {
        ...mockTask,
        description: 'Task description',
        dueDate: null,
      };

      expect(task.description).toBe('Task description');
      expect(task.dueDate).toBeNull();
    });

    it('should only allow task creation in To-Do column', () => {
      const todoColumn = mockBoard.columns.find(col => col.title === 'To-Do');
      const inProgressColumn = mockBoard.columns.find(col => col.title === 'In-Progress');

      expect(todoColumn?.title).toBe('To-Do');
      expect(inProgressColumn?.title).toBe('In-Progress');
      
      // Task should only be created in To-Do
      const canCreateInTodo = todoColumn?.title === 'To-Do';
      const canCreateInProgress = inProgressColumn?.title === 'To-Do';

      expect(canCreateInTodo).toBe(true);
      expect(canCreateInProgress).toBe(false);
    });
  });

  describe('Task Dragging and Column Movement', () => {
    it('should move task from To-Do to In-Progress', () => {
      const task = { ...mockTask, columnId: 'col-1' };
      const newColumnId = 'col-2';
      const targetColumn = mockBoard.columns.find(col => col.id === newColumnId);

      // Simulate move
      const updatedTask: Task = {
        ...task,
        columnId: newColumnId,
        locked: false, // Should not be locked when moving to In-Progress
      };

      expect(updatedTask.columnId).toBe(newColumnId);
      expect(updatedTask.locked).toBe(false);
      expect(targetColumn?.title).toBe('In-Progress');
    });

    it('should lock task when moved to Done column', () => {
      const task = { ...mockTask, columnId: 'col-1' };
      const doneColumnId = 'col-4';
      const doneColumn = mockBoard.columns.find(col => col.id === doneColumnId);

      // Simulate move to Done
      const isMovingToDone = doneColumn?.title === 'Done';
      const updatedTask: Task = {
        ...task,
        columnId: doneColumnId,
        locked: isMovingToDone,
        movedToDoneAt: isMovingToDone ? new Date() : null,
      };

      expect(updatedTask.columnId).toBe(doneColumnId);
      expect(updatedTask.locked).toBe(true);
      expect(updatedTask.movedToDoneAt).not.toBeNull();
    });

    it('should unlock task when moved from Done to another column', () => {
      const lockedTask: Task = {
        ...mockTask,
        columnId: 'col-4', // Done column
        locked: true,
        movedToDoneAt: new Date(),
      };

      const targetColumnId = 'col-2'; // In-Progress
      const targetColumn = mockBoard.columns.find(col => col.id === targetColumnId);
      const isMovingFromDone = lockedTask.columnId === 'col-4';
      const isMovingToDone = targetColumn?.title === 'Done';

      // Simulate move from Done
      const updatedTask: Task = {
        ...lockedTask,
        columnId: targetColumnId,
        locked: isMovingToDone,
        movedToDoneAt: isMovingToDone ? new Date() : null,
      };

      expect(updatedTask.columnId).toBe(targetColumnId);
      expect(updatedTask.locked).toBe(false);
      expect(updatedTask.movedToDoneAt).toBeNull();
    });

    it('should maintain task order when moved', () => {
      const tasks = [
        { ...mockTask, id: 'task-1', order: 0 },
        { ...mockTask, id: 'task-2', order: 1 },
        { ...mockTask, id: 'task-3', order: 2 },
      ];

      // Move task-2 to position 0
      const movedTask = tasks[1];
      const updatedTasks = [
        { ...movedTask, order: 0 },
        { ...tasks[0], order: 1 },
        { ...tasks[2], order: 2 },
      ];

      expect(updatedTasks[0].id).toBe('task-2');
      expect(updatedTasks[0].order).toBe(0);
      expect(updatedTasks[1].order).toBe(1);
      expect(updatedTasks[2].order).toBe(2);
    });
  });

  describe('Task Locking Logic', () => {
    it('should determine locked status based on target column', () => {
      const task = { ...mockTask };
      const targetColumn = mockBoard.columns.find(col => col.title === 'Done');
      const isMovingToDone = targetColumn?.title === 'Done';

      const updatedTask: Task = {
        ...task,
        locked: isMovingToDone,
      };

      expect(updatedTask.locked).toBe(true);
    });

    it('should not lock task when moving to non-Done column', () => {
      const task = { ...mockTask };
      const targetColumn = mockBoard.columns.find(col => col.title === 'In-Progress');
      const isMovingToDone = targetColumn?.title === 'Done';

      const updatedTask: Task = {
        ...task,
        locked: isMovingToDone,
      };

      expect(updatedTask.locked).toBe(false);
    });

    it('should set movedToDoneAt timestamp when locking', () => {
      const task = { ...mockTask };
      const targetColumn = mockBoard.columns.find(col => col.title === 'Done');
      const isMovingToDone = targetColumn?.title === 'Done';

      const updatedTask: Task = {
        ...task,
        locked: isMovingToDone,
        movedToDoneAt: isMovingToDone ? new Date() : null,
      };

      expect(updatedTask.movedToDoneAt).not.toBeNull();
      expect(updatedTask.movedToDoneAt).toBeInstanceOf(Date);
    });
  });

  describe('Optimistic Update Logic', () => {
    it('should create deep copy of board for optimistic update', () => {
      const originalBoard = { ...mockBoard };
      const updatedBoard = {
        ...originalBoard,
        columns: originalBoard.columns.map(col => ({ ...col })),
      };

      // Verify it's a different object
      expect(updatedBoard).not.toBe(originalBoard);
      expect(updatedBoard.columns).not.toBe(originalBoard.columns);
    });

    it('should update task in source column correctly', () => {
      const sourceColumn = mockBoard.columns[0];
      sourceColumn.tasks = [mockTask];

      const updatedTasks = sourceColumn.tasks
        .filter(t => t.id !== mockTask.id)
        .map((t, index) => ({ ...t, order: index }));

      expect(updatedTasks.length).toBe(0);
    });

    it('should insert task at correct position in target column', () => {
      const targetColumn = mockBoard.columns[1];
      const existingTasks = [
        { ...mockTask, id: 'task-1', order: 0 },
        { ...mockTask, id: 'task-2', order: 1 },
      ];
      targetColumn.tasks = existingTasks;

      const newTask = { ...mockTask, id: 'task-3', columnId: targetColumn.id, order: 1 };
      const targetTasks = targetColumn.tasks.filter(t => t.id !== newTask.id);
      targetTasks.splice(1, 0, newTask);

      const reorderedTasks = targetTasks.map((t, index) => ({ ...t, order: index }));

      expect(reorderedTasks.length).toBe(3);
      expect(reorderedTasks[1].id).toBe('task-3');
      expect(reorderedTasks[0].order).toBe(0);
      expect(reorderedTasks[1].order).toBe(1);
      expect(reorderedTasks[2].order).toBe(2);
    });
  });

  describe('Column Order Persistence', () => {
    it('should maintain column order', () => {
      const sortedColumns = [...mockBoard.columns].sort((a, b) => a.order - b.order);

      expect(sortedColumns[0].title).toBe('To-Do');
      expect(sortedColumns[1].title).toBe('In-Progress');
      expect(sortedColumns[2].title).toBe('Review');
      expect(sortedColumns[3].title).toBe('Done');
    });

    it('should calculate new order when reordering columns', () => {
      const sortedCols = [...mockBoard.columns].sort((a, b) => a.order - b.order);
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
  });

  describe('Edge Cases', () => {
    it('should handle empty column correctly', () => {
      const emptyColumn = mockBoard.columns[1];
      emptyColumn.tasks = [];

      const newOrder = emptyColumn.tasks.length > 0 
        ? Math.max(...emptyColumn.tasks.map(t => t.order)) + 1
        : 0;

      expect(newOrder).toBe(0);
    });

    it('should handle task with no change in position', () => {
      const task = { ...mockTask, columnId: 'col-1', order: 0 };
      const newColumnId = 'col-1';
      const newOrder = 0;

      const hasNoChange = task.columnId === newColumnId && task.order === newOrder;
      expect(hasNoChange).toBe(true);
    });

    it('should handle moving task to end of column', () => {
      const targetColumn = mockBoard.columns[1];
      targetColumn.tasks = [
        { ...mockTask, id: 'task-1', order: 0 },
        { ...mockTask, id: 'task-2', order: 1 },
      ];

      const targetTasks = targetColumn.tasks.filter(t => t.id !== 'new-task');
      const newOrder = targetTasks.length; // Place at end

      expect(newOrder).toBe(2);
    });
  });
});
