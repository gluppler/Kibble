/**
 * Permission Tests
 * 
 * Tests for user permissions across:
 * - Feature 1: Tasks, Kanban Boards, Class-based Task Categories
 * - Feature 2: Due Date Alerts, Completion Alerts
 * 
 * Verifies that users can only access/modify their own resources.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module before importing permissions
vi.mock('@/lib/db', () => {
  const mockDb = {
    board: {
      findUnique: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
    },
    column: {
      findUnique: vi.fn(),
    },
  };
  return {
    db: mockDb,
  };
});

import {
  checkAuthentication,
  checkBoardOwnership,
  checkTaskOwnership,
  checkColumnOwnership,
  checkAlertAccess,
  checkAlertsListAccess,
  checkColumnBoardMatch,
  checkBoardPermission,
  checkTaskPermission,
  checkColumnPermission,
  checkAlertPermission,
} from '@/lib/permissions';
import { db } from '@/lib/db';

const mockDb = db as any;

describe('Permission Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAuthentication', () => {
    it('should allow authenticated users', () => {
      const session = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      };

      const result = checkAuthentication(session as any);
      expect(result.allowed).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should deny unauthenticated users', () => {
      const result = checkAuthentication(null);
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Unauthorized');
      expect(result.statusCode).toBe(401);
    });

    it('should deny sessions without user ID', () => {
      const session = {
        user: {
          email: 'test@example.com',
        },
      };

      const result = checkAuthentication(session as any);
      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(401);
    });
  });

  describe('checkBoardOwnership', () => {
    it('should allow access to own board', async () => {
      mockDb.board.findUnique.mockResolvedValue({
        userId: 'user-1',
      });

      const result = await checkBoardOwnership('board-1', 'user-1');
      expect(result.allowed).toBe(true);
      expect(mockDb.board.findUnique).toHaveBeenCalledWith({
        where: { id: 'board-1' },
        select: { userId: true },
      });
    });

    it('should deny access to other user\'s board', async () => {
      mockDb.board.findUnique.mockResolvedValue({
        userId: 'user-2',
      });

      const result = await checkBoardOwnership('board-1', 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Forbidden');
      expect(result.statusCode).toBe(403);
    });

    it('should return 404 for non-existent board', async () => {
      mockDb.board.findUnique.mockResolvedValue(null);

      const result = await checkBoardOwnership('board-1', 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.statusCode).toBe(404);
    });
  });

  describe('checkTaskOwnership', () => {
    it('should allow access to own task', async () => {
      mockDb.task.findUnique.mockResolvedValue({
        id: 'task-1',
        column: {
          board: {
            userId: 'user-1',
          },
        },
      });

      const result = await checkTaskOwnership('task-1', 'user-1');
      expect(result.allowed).toBe(true);
    });

    it('should deny access to other user\'s task', async () => {
      mockDb.task.findUnique.mockResolvedValue({
        id: 'task-1',
        column: {
          board: {
            userId: 'user-2',
          },
        },
      });

      const result = await checkTaskOwnership('task-1', 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('Forbidden');
      expect(result.statusCode).toBe(403);
    });

    it('should return 404 for non-existent task', async () => {
      mockDb.task.findUnique.mockResolvedValue(null);

      const result = await checkTaskOwnership('task-1', 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(404);
    });
  });

  describe('checkColumnOwnership', () => {
    it('should allow access to own column', async () => {
      mockDb.column.findUnique.mockResolvedValue({
        id: 'column-1',
        board: {
          userId: 'user-1',
        },
      });

      const result = await checkColumnOwnership('column-1', 'user-1');
      expect(result.allowed).toBe(true);
    });

    it('should deny access to other user\'s column', async () => {
      mockDb.column.findUnique.mockResolvedValue({
        id: 'column-1',
        board: {
          userId: 'user-2',
        },
      });

      const result = await checkColumnOwnership('column-1', 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });

  describe('checkAlertAccess', () => {
    it('should allow access to alerts for own tasks', async () => {
      mockDb.task.findUnique.mockResolvedValue({
        id: 'task-1',
        column: {
          board: {
            userId: 'user-1',
          },
        },
      });

      const result = await checkAlertAccess('task-1', 'user-1');
      expect(result.allowed).toBe(true);
    });

    it('should deny access to alerts for other user\'s tasks', async () => {
      mockDb.task.findUnique.mockResolvedValue({
        id: 'task-1',
        column: {
          board: {
            userId: 'user-2',
          },
        },
      });

      const result = await checkAlertAccess('task-1', 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });

  describe('checkAlertsListAccess', () => {
    it('should allow access for authenticated users', () => {
      const result = checkAlertsListAccess('user-1');
      expect(result.allowed).toBe(true);
    });

    it('should deny access for unauthenticated users', () => {
      const result = checkAlertsListAccess(undefined);
      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(401);
    });
  });

  describe('checkColumnBoardMatch', () => {
    it('should allow moving task within same board', async () => {
      mockDb.column.findUnique.mockResolvedValue({
        id: 'column-2',
        board: {
          id: 'board-1',
          userId: 'user-1',
        },
      });

      const result = await checkColumnBoardMatch('column-2', 'board-1', 'user-1');
      expect(result.allowed).toBe(true);
    });

    it('should deny moving task to different board', async () => {
      mockDb.column.findUnique.mockResolvedValue({
        id: 'column-2',
        board: {
          id: 'board-2',
          userId: 'user-1',
        },
      });

      const result = await checkColumnBoardMatch('column-2', 'board-1', 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.error).toContain('different board');
      expect(result.statusCode).toBe(403);
    });

    it('should deny moving task to other user\'s column', async () => {
      mockDb.column.findUnique.mockResolvedValue({
        id: 'column-2',
        board: {
          id: 'board-1',
          userId: 'user-2',
        },
      });

      const result = await checkColumnBoardMatch('column-2', 'board-1', 'user-1');
      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(403);
    });
  });

  describe('Comprehensive Permission Checks', () => {
    it('checkBoardPermission should combine auth and ownership', async () => {
      const session = {
        user: { id: 'user-1' },
      };

      mockDb.board.findUnique.mockResolvedValue({
        userId: 'user-1',
      });

      const result = await checkBoardPermission('board-1', session as any);
      expect(result.allowed).toBe(true);
    });

    it('checkBoardPermission should deny unauthenticated users', async () => {
      const result = await checkBoardPermission('board-1', null);
      expect(result.allowed).toBe(false);
      expect(result.statusCode).toBe(401);
    });

    it('checkTaskPermission should combine auth and ownership', async () => {
      const session = {
        user: { id: 'user-1' },
      };

      mockDb.task.findUnique.mockResolvedValue({
        id: 'task-1',
        column: {
          board: {
            userId: 'user-1',
          },
        },
      });

      const result = await checkTaskPermission('task-1', session as any);
      expect(result.allowed).toBe(true);
    });

    it('checkAlertPermission should combine auth and task ownership', async () => {
      const session = {
        user: { id: 'user-1' },
      };

      mockDb.task.findUnique.mockResolvedValue({
        id: 'task-1',
        column: {
          board: {
            userId: 'user-1',
          },
        },
      });

      const result = await checkAlertPermission('task-1', session as any);
      expect(result.allowed).toBe(true);
    });
  });
});
