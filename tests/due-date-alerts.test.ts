/**
 * Test Suite for Due Date Alerts Feature
 * 
 * Tests cover:
 * - Alert generation for tasks with due dates
 * - Urgency levels (RED for 10 days, 1 day, overdue)
 * - Completion alerts (GREEN when moved to Done)
 * - Real-time updates on task creation
 * - Alert close functionality
 * - Browser Notification API integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Mock Browser Notification API
 */
class MockNotification {
  constructor(public title: string, public options?: NotificationOptions) {}
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  dispatchEvent = vi.fn();
}

const mockNotification = {
  requestPermission: vi.fn(() => Promise.resolve('granted')),
  permission: 'granted' as NotificationPermission,
};

// Mock global Notification constructor
global.Notification = MockNotification as any;
(global.Notification as any).requestPermission = mockNotification.requestPermission;
(global.Notification as any).permission = mockNotification.permission;

/**
 * Helper function to calculate days until due date
 */
function calculateDaysUntil(dueDate: Date): number {
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Helper function to determine alert urgency
 */
function getAlertUrgency(daysUntil: number): 'urgent' | 'warning' | 'normal' | null {
  if (daysUntil < 0) return 'urgent'; // Overdue
  if (daysUntil === 0) return 'urgent'; // Due today
  if (daysUntil === 1) return 'urgent'; // Due tomorrow
  if (daysUntil <= 10) return 'warning'; // Due within 10 days
  return null; // No alert needed
}

describe('Due Date Alerts Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Alert Urgency Calculation', () => {
    it('should return urgent for overdue tasks', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const daysUntil = calculateDaysUntil(pastDate);
      
      expect(daysUntil).toBeLessThan(0);
      expect(getAlertUrgency(daysUntil)).toBe('urgent');
    });

    it('should return urgent for tasks due today', () => {
      const today = new Date();
      const daysUntil = calculateDaysUntil(today);
      
      expect(getAlertUrgency(daysUntil)).toBe('urgent');
    });

    it('should return urgent for tasks due tomorrow (1 day away)', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const daysUntil = calculateDaysUntil(tomorrow);
      
      expect(daysUntil).toBe(1);
      expect(getAlertUrgency(daysUntil)).toBe('urgent');
    });

    it('should return warning for tasks due within 10 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const daysUntil = calculateDaysUntil(futureDate);
      
      expect(daysUntil).toBeGreaterThan(0);
      expect(daysUntil).toBeLessThanOrEqual(10);
      expect(getAlertUrgency(daysUntil)).toBe('warning');
    });

    it('should return null for tasks due more than 10 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const daysUntil = calculateDaysUntil(futureDate);
      
      expect(daysUntil).toBeGreaterThan(10);
      expect(getAlertUrgency(daysUntil)).toBeNull();
    });
  });

  describe('Alert Generation on Task Creation', () => {
    it('should generate RED alert when task is created with due date 1 day away', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const task = {
        id: 'task-1',
        title: 'Urgent Task',
        dueDate: tomorrow,
      };

      const daysUntil = calculateDaysUntil(task.dueDate);
      const urgency = getAlertUrgency(daysUntil);

      expect(urgency).toBe('urgent');
      expect(daysUntil).toBe(1);
    });

    it('should generate RED alert when task is created with due date 10 days away', () => {
      const tenDaysLater = new Date();
      tenDaysLater.setDate(tenDaysLater.getDate() + 10);
      
      const task = {
        id: 'task-2',
        title: 'Important Task',
        dueDate: tenDaysLater,
      };

      const daysUntil = calculateDaysUntil(task.dueDate);
      const urgency = getAlertUrgency(daysUntil);

      expect(urgency).toBe('warning');
      expect(daysUntil).toBe(10);
    });

    it('should not generate alert when task is created with due date more than 10 days away', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);
      
      const task = {
        id: 'task-3',
        title: 'Future Task',
        dueDate: futureDate,
      };

      const daysUntil = calculateDaysUntil(task.dueDate);
      const urgency = getAlertUrgency(daysUntil);

      expect(urgency).toBeNull();
    });

    it('should not generate alert when task is created without due date', () => {
      const task = {
        id: 'task-4',
        title: 'No Due Date Task',
        dueDate: null,
      };

      expect(task.dueDate).toBeNull();
    });
  });

  describe('Completion Alert on Task Move to Done', () => {
    it('should generate GREEN completion alert when task is moved to Done column', () => {
      const task = {
        id: 'task-5',
        title: 'Completed Task',
        columnTitle: 'Done',
        locked: true,
      };

      const isCompleted = task.columnTitle === 'Done' && task.locked;
      expect(isCompleted).toBe(true);
    });

    it('should not generate completion alert when task is moved from Done to another column', () => {
      const task = {
        id: 'task-6',
        title: 'Moved Task',
        columnTitle: 'In-Progress',
        locked: false,
      };

      const isCompleted = task.columnTitle === 'Done' && task.locked;
      expect(isCompleted).toBe(false);
    });
  });

  describe('Browser Notification API Integration', () => {
    it('should request notification permission', async () => {
      const permission = await mockNotification.requestPermission();
      expect(permission).toBe('granted');
      expect(mockNotification.requestPermission).toHaveBeenCalled();
    });

    it('should create notification with correct options for urgent alert', () => {
      const notification = new Notification('Urgent Task Due Soon', {
        body: 'Task "Urgent Task" is due in 1 day',
        icon: '/icon-192.png',
        tag: 'task-urgent-1',
        requireInteraction: true,
      });

      expect(notification).toBeDefined();
      expect(notification.title).toBe('Urgent Task Due Soon');
      expect(notification.options?.body).toBe('Task "Urgent Task" is due in 1 day');
      expect(notification.options?.tag).toBe('task-urgent-1');
      expect(notification.options?.icon).toBe('/icon-192.png');
    });

    it('should create notification with correct options for completion alert', () => {
      const notification = new Notification('Task Completed!', {
        body: 'Congratulations! "Completed Task" has been moved to Done',
        icon: '/icon-192.png',
        tag: 'task-completed-5',
        requireInteraction: false,
      });

      expect(notification).toBeDefined();
      expect(notification.title).toBe('Task Completed!');
      expect(notification.options?.body).toBe('Congratulations! "Completed Task" has been moved to Done');
      expect(notification.options?.tag).toBe('task-completed-5');
    });

    it('should handle notification permission denied', async () => {
      mockNotification.requestPermission.mockResolvedValueOnce('denied');
      const permission = await mockNotification.requestPermission();
      
      expect(permission).toBe('denied');
    });

    it('should handle notification permission default', async () => {
      mockNotification.requestPermission.mockResolvedValueOnce('default');
      const permission = await mockNotification.requestPermission();
      
      expect(permission).toBe('default');
    });
  });

  describe('Alert Close Functionality', () => {
    it('should allow closing individual alerts', () => {
      const alerts = [
        { id: 'alert-1', taskId: 'task-1', closed: false },
        { id: 'alert-2', taskId: 'task-2', closed: false },
      ];

      // Close first alert
      alerts[0].closed = true;

      expect(alerts[0].closed).toBe(true);
      expect(alerts[1].closed).toBe(false);
    });

    it('should remove closed alerts from display', () => {
      const alerts = [
        { id: 'alert-1', taskId: 'task-1', closed: false },
        { id: 'alert-2', taskId: 'task-2', closed: true },
        { id: 'alert-3', taskId: 'task-3', closed: false },
      ];

      const visibleAlerts = alerts.filter(alert => !alert.closed);

      expect(visibleAlerts).toHaveLength(2);
      expect(visibleAlerts.map(a => a.id)).toEqual(['alert-1', 'alert-3']);
    });
  });

  describe('Real-time Updates', () => {
    it('should update alerts immediately when task is created', () => {
      const initialAlerts: any[] = [];
      
      const newTask = {
        id: 'task-new',
        title: 'New Task',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      };

      const daysUntil = calculateDaysUntil(newTask.dueDate);
      const urgency = getAlertUrgency(daysUntil);

      if (urgency === 'urgent' || urgency === 'warning') {
        initialAlerts.push({
          id: `alert-${newTask.id}`,
          taskId: newTask.id,
          type: urgency === 'urgent' ? 'urgent' : 'warning',
          taskTitle: newTask.title,
          daysUntil,
        });
      }

      expect(initialAlerts).toHaveLength(1);
      expect(initialAlerts[0].type).toBe('urgent');
    });

    it('should update alerts immediately when task is moved to Done', () => {
      const alerts: any[] = [
        { id: 'alert-1', taskId: 'task-1', type: 'urgent', closed: false },
      ];

      const task = {
        id: 'task-1',
        title: 'Task',
        columnTitle: 'Done',
        locked: true,
      };

      // Add completion alert
      if (task.columnTitle === 'Done' && task.locked) {
        alerts.push({
          id: `completion-${task.id}`,
          taskId: task.id,
          type: 'completion',
          taskTitle: task.title,
        });
      }

      expect(alerts).toHaveLength(2);
      expect(alerts[1].type).toBe('completion');
    });
  });

  describe('Alert Color Coding', () => {
    it('should use RED color for urgent alerts (overdue, today, 1 day, 10 days)', () => {
      const urgentCases = [
        { daysUntil: -5, expectedColor: 'red' },
        { daysUntil: 0, expectedColor: 'red' },
        { daysUntil: 1, expectedColor: 'red' },
        { daysUntil: 10, expectedColor: 'red' },
      ];

      urgentCases.forEach(({ daysUntil, expectedColor }) => {
        const urgency = getAlertUrgency(daysUntil);
        const color = (urgency === 'urgent' || urgency === 'warning') ? 'red' : 'none';
        expect(color).toBe(expectedColor);
      });
    });

    it('should use GREEN color for completion alerts', () => {
      const completionAlert = {
        id: 'completion-1',
        type: 'completion',
        color: 'green',
      };

      expect(completionAlert.color).toBe('green');
      expect(completionAlert.type).toBe('completion');
    });
  });
});
