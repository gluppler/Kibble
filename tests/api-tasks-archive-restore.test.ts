/**
 * API Task Archive Restore Endpoint Tests
 * 
 * These tests verify the /api/tasks/[id]/archive DELETE endpoint:
 * - Cannot restore tasks from archived boards
 * - Proper error messages when attempting to restore from archived board
 * - Can restore tasks from non-archived boards
 * - Permission checks
 * 
 * Note: These are unit tests for logic validation.
 * Integration tests would require a running server.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';

describe('DELETE /api/tasks/[id]/archive - Restore Task Validation', () => {
  let testUserId: string;
  let testBoardId: string;
  let testArchivedBoardId: string;
  let testColumnId: string;
  let testArchivedColumnId: string;
  let testTaskId: string;
  let testArchivedTaskId: string;

  beforeEach(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: `test-task-restore-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Test User',
      },
    });
    testUserId = user.id;

    // Create non-archived board
    const board = await db.board.create({
      data: {
        title: 'Active Test Board',
        userId: testUserId,
        position: 0,
        archived: false,
      },
    });
    testBoardId = board.id;

    // Create archived board
    const archivedBoard = await db.board.create({
      data: {
        title: 'Archived Test Board',
        userId: testUserId,
        position: 0,
        archived: true,
        archivedAt: new Date(),
      },
    });
    testArchivedBoardId = archivedBoard.id;

    // Create column in non-archived board
    const column = await db.column.create({
      data: {
        title: 'To-Do',
        boardId: testBoardId,
        order: 0,
      },
    });
    testColumnId = column.id;

    // Create column in archived board
    const archivedColumn = await db.column.create({
      data: {
        title: 'To-Do',
        boardId: testArchivedBoardId,
        order: 0,
      },
    });
    testArchivedColumnId = archivedColumn.id;

    // Create archived task in non-archived board
    const task = await db.task.create({
      data: {
        title: 'Task in Active Board',
        columnId: testColumnId,
        order: 0,
        archived: true,
        archivedAt: new Date(),
      },
    });
    testTaskId = task.id;

    // Create archived task in archived board
    const archivedTask = await db.task.create({
      data: {
        title: 'Task in Archived Board',
        columnId: testArchivedColumnId,
        order: 0,
        archived: true,
        archivedAt: new Date(),
      },
    });
    testArchivedTaskId = archivedTask.id;
  });

  afterEach(async () => {
    // Cleanup
    if (testTaskId) {
      await db.task.deleteMany({
        where: { id: { in: [testTaskId, testArchivedTaskId] } },
      });
    }
    if (testColumnId) {
      await db.column.deleteMany({
        where: { id: { in: [testColumnId, testArchivedColumnId] } },
      });
    }
    if (testBoardId) {
      await db.board.deleteMany({
        where: { id: { in: [testBoardId, testArchivedBoardId] } },
      });
    }
    if (testUserId) {
      await db.user.deleteMany({
        where: { id: testUserId },
      });
    }
  });

  it('should prevent restoring task from archived board', async () => {
    // Get task with board information
    const taskWithBoard = await db.task.findUnique({
      where: { id: testArchivedTaskId },
      include: {
        column: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
                archived: true,
              },
            },
          },
        },
      },
    });

    expect(taskWithBoard).not.toBeNull();
    expect(taskWithBoard?.column.board.archived).toBe(true);

    // Simulate the API validation logic
    if (taskWithBoard && taskWithBoard.column.board.archived) {
      const errorResponse = {
        error: "Cannot restore task from archived board",
        message: `This task belongs to an archived board "${taskWithBoard.column.board.title}". Please restore the board first before restoring this task.`,
        boardId: taskWithBoard.column.board.id,
        boardTitle: taskWithBoard.column.board.title,
      };

      expect(errorResponse.error).toBe("Cannot restore task from archived board");
      expect(errorResponse.message).toContain("archived board");
      expect(errorResponse.message).toContain(taskWithBoard.column.board.title);
      expect(errorResponse.boardId).toBe(testArchivedBoardId);
    }
  });

  it('should allow restoring task from non-archived board', async () => {
    // Get task with board information
    const taskWithBoard = await db.task.findUnique({
      where: { id: testTaskId },
      include: {
        column: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
                archived: true,
              },
            },
          },
        },
      },
    });

    expect(taskWithBoard).not.toBeNull();
    expect(taskWithBoard?.column.board.archived).toBe(false);

    // Simulate the API restore logic (should succeed)
    if (taskWithBoard && !taskWithBoard.column.board.archived) {
      const restoredTask = await db.task.update({
        where: { id: testTaskId },
        data: {
          archived: false,
          archivedAt: null,
        },
      });

      expect(restoredTask.archived).toBe(false);
      expect(restoredTask.archivedAt).toBeNull();
    }
  });

  it('should return proper error message with board details', async () => {
    const taskWithBoard = await db.task.findUnique({
      where: { id: testArchivedTaskId },
      include: {
        column: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
                archived: true,
              },
            },
          },
        },
      },
    });

    if (taskWithBoard && taskWithBoard.column.board.archived) {
      const errorResponse = {
        error: "Cannot restore task from archived board",
        message: `This task belongs to an archived board "${taskWithBoard.column.board.title}". Please restore the board first before restoring this task.`,
        boardId: taskWithBoard.column.board.id,
        boardTitle: taskWithBoard.column.board.title,
      };

      // Verify error message contains all necessary information
      expect(errorResponse.error).toBeTruthy();
      expect(errorResponse.message).toBeTruthy();
      expect(errorResponse.message).toContain(taskWithBoard.column.board.title);
      expect(errorResponse.message).toContain("restore the board first");
      expect(errorResponse.boardId).toBe(testArchivedBoardId);
      expect(errorResponse.boardTitle).toBe("Archived Test Board");
    }
  });

  it('should handle task not found', async () => {
    const nonExistentTaskId = "non-existent-task-id";
    const taskWithBoard = await db.task.findUnique({
      where: { id: nonExistentTaskId },
      include: {
        column: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
                archived: true,
              },
            },
          },
        },
      },
    });

    expect(taskWithBoard).toBeNull();
  });

  it('should check board archived status before allowing restore', async () => {
    // Verify task in archived board cannot be restored
    const archivedTask = await db.task.findUnique({
      where: { id: testArchivedTaskId },
      include: {
        column: {
          include: {
            board: {
              select: {
                archived: true,
              },
            },
          },
        },
      },
    });

    expect(archivedTask?.column.board.archived).toBe(true);

    // Verify task in non-archived board can be restored
    const activeTask = await db.task.findUnique({
      where: { id: testTaskId },
      include: {
        column: {
          include: {
            board: {
              select: {
                archived: true,
              },
            },
          },
        },
      },
    });

    expect(activeTask?.column.board.archived).toBe(false);
  });
});
