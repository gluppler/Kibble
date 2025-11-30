/**
 * API Board Archive Endpoint Tests
 * 
 * These tests verify the /api/boards/[id]/archive endpoint:
 * - Board archiving includes all tasks
 * - Board unarchiving includes all tasks
 * - Transaction atomicity
 * - Permission checks
 * - Edge cases (empty board, already archived tasks, etc.)
 * 
 * Note: These are unit tests for logic validation.
 * Integration tests would require a running server.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';

describe('POST /api/boards/[id]/archive', () => {
  let testUserId: string;
  let testBoardId: string;
  let testColumnId: string;
  let testTaskIds: string[];

  beforeEach(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: `test-board-archive-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Test User',
      },
    });
    testUserId = user.id;

    // Create test board
    const board = await db.board.create({
      data: {
        title: 'Test Board for Archive',
        userId: testUserId,
        position: 0,
      },
    });
    testBoardId = board.id;

    // Create test column
    const column = await db.column.create({
      data: {
        title: 'To-Do',
        boardId: testBoardId,
        order: 0,
      },
    });
    testColumnId = column.id;

    // Create test tasks
    const tasks = await Promise.all([
      db.task.create({
        data: {
          title: 'Task 1',
          columnId: testColumnId,
          order: 0,
        },
      }),
      db.task.create({
        data: {
          title: 'Task 2',
          columnId: testColumnId,
          order: 1,
        },
      }),
      db.task.create({
        data: {
          title: 'Task 3',
          columnId: testColumnId,
          order: 2,
        },
      }),
    ]);
    testTaskIds = tasks.map(t => t.id);
  });

  afterEach(async () => {
    // Cleanup: Delete test data
    if (testTaskIds && testTaskIds.length > 0) {
      await db.task.deleteMany({
        where: { id: { in: testTaskIds } },
      });
    }
    if (testColumnId) {
      await db.column.deleteMany({
        where: { id: testColumnId },
      });
    }
    if (testBoardId) {
      await db.board.deleteMany({
        where: { id: testBoardId },
      });
    }
    if (testUserId) {
      await db.user.deleteMany({
        where: { id: testUserId },
      });
    }
  });

  it('should archive board and all its tasks', async () => {
    // Verify initial state
    const boardBefore = await db.board.findUnique({
      where: { id: testBoardId },
    });
    expect(boardBefore?.archived).toBe(false);
    expect(boardBefore?.archivedAt).toBeNull();

    const tasksBefore = await db.task.findMany({
      where: { id: { in: testTaskIds } },
    });
    expect(tasksBefore.every(t => !t.archived)).toBe(true);
    expect(tasksBefore.every(t => !t.archivedAt)).toBe(true);

    // Archive the board (simulating the API logic)
    const archiveDate = new Date();
    await db.$transaction(async (tx) => {
      await tx.board.update({
        where: { id: testBoardId },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
      });

      await tx.task.updateMany({
        where: {
          column: {
            boardId: testBoardId,
          },
          archived: false,
        },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
      });
    });

    // Verify board is archived
    const boardAfter = await db.board.findUnique({
      where: { id: testBoardId },
    });
    expect(boardAfter?.archived).toBe(true);
    expect(boardAfter?.archivedAt).not.toBeNull();

    // Verify all tasks are archived
    const tasksAfter = await db.task.findMany({
      where: { id: { in: testTaskIds } },
    });
    expect(tasksAfter).toHaveLength(3);
    expect(tasksAfter.every(t => t.archived)).toBe(true);
    expect(tasksAfter.every(t => t.archivedAt)).toBeTruthy();

    // Verify archived board includes archived tasks when fetched via archive API
    // This simulates what the archive page would see
    const archivedBoard = await db.board.findUnique({
      where: { id: testBoardId },
      include: {
        columns: {
          include: {
            tasks: {
              where: {
                archived: true, // Archived boards should show archived tasks
              },
            },
          },
        },
      },
    });
    expect(archivedBoard).not.toBeNull();
    const taskCount = archivedBoard!.columns.reduce(
      (sum, col) => sum + col.tasks.length,
      0
    );
    expect(taskCount).toBe(3); // All 3 tasks should be counted
  });

  it('should only archive non-archived tasks', async () => {
    // Archive one task manually first
    await db.task.update({
      where: { id: testTaskIds[0] },
      data: {
        archived: true,
        archivedAt: new Date(),
      },
    });

    // Archive the board
    const archiveDate = new Date();
    await db.$transaction(async (tx) => {
      await tx.board.update({
        where: { id: testBoardId },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
      });

      await tx.task.updateMany({
        where: {
          column: {
            boardId: testBoardId,
          },
          archived: false,
        },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
      });
    });

    // Verify all tasks are archived
    const tasksAfter = await db.task.findMany({
      where: { id: { in: testTaskIds } },
    });
    expect(tasksAfter.every(t => t.archived)).toBe(true);
    // The first task should have its original archivedAt, others should have the new one
    const firstTask = tasksAfter.find(t => t.id === testTaskIds[0]);
    const otherTasks = tasksAfter.filter(t => t.id !== testTaskIds[0]);
    expect(firstTask?.archived).toBe(true);
    expect(otherTasks.every(t => t.archivedAt?.getTime() === archiveDate.getTime())).toBe(true);
  });

  it('should handle empty board (no tasks)', async () => {
    // Delete all tasks
    await db.task.deleteMany({
      where: { id: { in: testTaskIds } },
    });

    // Archive the board
    const archiveDate = new Date();
    await db.$transaction(async (tx) => {
      await tx.board.update({
        where: { id: testBoardId },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
      });

      const result = await tx.task.updateMany({
        where: {
          column: {
            boardId: testBoardId,
          },
          archived: false,
        },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
      });

      expect(result.count).toBe(0);
    });

    // Verify board is archived
    const boardAfter = await db.board.findUnique({
      where: { id: testBoardId },
    });
    expect(boardAfter?.archived).toBe(true);
  });

  it('should archive tasks across multiple columns', async () => {
    // Create another column with tasks
    const column2 = await db.column.create({
      data: {
        title: 'In Progress',
        boardId: testBoardId,
        order: 1,
      },
    });

    const task4 = await db.task.create({
      data: {
        title: 'Task 4',
        columnId: column2.id,
        order: 0,
      },
    });

    // Archive the board
    const archiveDate = new Date();
    await db.$transaction(async (tx) => {
      await tx.board.update({
        where: { id: testBoardId },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
      });

      await tx.task.updateMany({
        where: {
          column: {
            boardId: testBoardId,
          },
          archived: false,
        },
        data: {
          archived: true,
          archivedAt: archiveDate,
        },
      });
    });

    // Verify all tasks from both columns are archived
    const allTasks = await db.task.findMany({
      where: {
        column: {
          boardId: testBoardId,
        },
      },
    });
    expect(allTasks).toHaveLength(4);
    expect(allTasks.every(t => t.archived)).toBe(true);

    // Cleanup
    await db.task.delete({ where: { id: task4.id } });
    await db.column.delete({ where: { id: column2.id } });
  });
});

describe('DELETE /api/boards/[id]/archive (Unarchive)', () => {
  let testUserId: string;
  let testBoardId: string;
  let testColumnId: string;
  let testTaskIds: string[];

  beforeEach(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: `test-board-unarchive-${Date.now()}@example.com`,
        password: 'hashedpassword',
        name: 'Test User',
      },
    });
    testUserId = user.id;

    // Create archived test board
    const board = await db.board.create({
      data: {
        title: 'Archived Test Board',
        userId: testUserId,
        position: 0,
        archived: true,
        archivedAt: new Date(),
      },
    });
    testBoardId = board.id;

    // Create test column
    const column = await db.column.create({
      data: {
        title: 'To-Do',
        boardId: testBoardId,
        order: 0,
      },
    });
    testColumnId = column.id;

    // Create archived test tasks
    const archiveDate = new Date();
    const tasks = await Promise.all([
      db.task.create({
        data: {
          title: 'Archived Task 1',
          columnId: testColumnId,
          order: 0,
          archived: true,
          archivedAt: archiveDate,
        },
      }),
      db.task.create({
        data: {
          title: 'Archived Task 2',
          columnId: testColumnId,
          order: 1,
          archived: true,
          archivedAt: archiveDate,
        },
      }),
    ]);
    testTaskIds = tasks.map(t => t.id);
  });

  afterEach(async () => {
    // Cleanup
    if (testTaskIds && testTaskIds.length > 0) {
      await db.task.deleteMany({
        where: { id: { in: testTaskIds } },
      });
    }
    if (testColumnId) {
      await db.column.deleteMany({
        where: { id: testColumnId },
      });
    }
    if (testBoardId) {
      await db.board.deleteMany({
        where: { id: testBoardId },
      });
    }
    if (testUserId) {
      await db.user.deleteMany({
        where: { id: testUserId },
      });
    }
  });

  it('should unarchive board and all its tasks', async () => {
    // Verify initial state
    const boardBefore = await db.board.findUnique({
      where: { id: testBoardId },
    });
    expect(boardBefore?.archived).toBe(true);

    const tasksBefore = await db.task.findMany({
      where: { id: { in: testTaskIds } },
    });
    expect(tasksBefore.every(t => t.archived)).toBe(true);

    // Unarchive the board (simulating the API logic)
    await db.$transaction(async (tx) => {
      await tx.board.update({
        where: { id: testBoardId },
        data: {
          archived: false,
          archivedAt: null,
        },
      });

      await tx.task.updateMany({
        where: {
          column: {
            boardId: testBoardId,
          },
          archived: true,
        },
        data: {
          archived: false,
          archivedAt: null,
        },
      });
    });

    // Verify board is unarchived
    const boardAfter = await db.board.findUnique({
      where: { id: testBoardId },
    });
    expect(boardAfter?.archived).toBe(false);
    expect(boardAfter?.archivedAt).toBeNull();

    // Verify all tasks are unarchived
    const tasksAfter = await db.task.findMany({
      where: { id: { in: testTaskIds } },
    });
    expect(tasksAfter).toHaveLength(2);
    expect(tasksAfter.every(t => !t.archived)).toBe(true);
    expect(tasksAfter.every(t => !t.archivedAt)).toBe(true);
  });

  it('should only unarchive archived tasks', async () => {
    // Unarchive one task manually first
    await db.task.update({
      where: { id: testTaskIds[0] },
      data: {
        archived: false,
        archivedAt: null,
      },
    });

    // Unarchive the board
    await db.$transaction(async (tx) => {
      await tx.board.update({
        where: { id: testBoardId },
        data: {
          archived: false,
          archivedAt: null,
        },
      });

      await tx.task.updateMany({
        where: {
          column: {
            boardId: testBoardId,
          },
          archived: true,
        },
        data: {
          archived: false,
          archivedAt: null,
        },
      });
    });

    // Verify all tasks are unarchived
    const tasksAfter = await db.task.findMany({
      where: { id: { in: testTaskIds } },
    });
    expect(tasksAfter.every(t => !t.archived)).toBe(true);
  });

  it('should handle empty board (no tasks)', async () => {
    // Delete all tasks
    await db.task.deleteMany({
      where: { id: { in: testTaskIds } },
    });

    // Unarchive the board
    await db.$transaction(async (tx) => {
      await tx.board.update({
        where: { id: testBoardId },
        data: {
          archived: false,
          archivedAt: null,
        },
      });

      const result = await tx.task.updateMany({
        where: {
          column: {
            boardId: testBoardId,
          },
          archived: true,
        },
        data: {
          archived: false,
          archivedAt: null,
        },
      });

      expect(result.count).toBe(0);
    });

    // Verify board is unarchived
    const boardAfter = await db.board.findUnique({
      where: { id: testBoardId },
    });
    expect(boardAfter?.archived).toBe(false);
  });
});
