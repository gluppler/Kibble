# Task Persistence and Column Behavior Test Cases

## Overview
This document describes comprehensive test cases for task dragging, persistence, locking behavior, and column interactions.

## Test Environment Setup

### Prerequisites
1. Application running on `http://localhost:3000`
2. User logged in with a board containing default columns:
   - To-Do
   - In-Progress
   - Review
   - Done

### Test Data
- Test User: `test@example.com` / `test123`
- Board: Default board with 4 columns

---

## Test Suite 1: Task Creation and Persistence

### TC-001: Create Task in To-Do Column
**Steps:**
1. Navigate to the board
2. Click "Add Task" in the "To-Do" column
3. Enter task title: "Test Task 1"
4. Optionally add description and due date
5. Submit the form

**Expected Results:**
- ✅ Task appears immediately in "To-Do" column
- ✅ Task persists after page refresh
- ✅ Task persists after logout/login
- ✅ Task is not locked (`locked: false`)
- ✅ Task can be edited
- ✅ Task can be dragged to other columns

### TC-002: Create Task with No Due Date
**Steps:**
1. Create a task with only a title (no description, no due date)
2. Submit the form

**Expected Results:**
- ✅ Task is created successfully
- ✅ Task persists after refresh
- ✅ Task shows no due date indicator
- ✅ Task can be moved to other columns

### TC-003: Create Task with Description but No Due Date
**Steps:**
1. Create a task with title and description (no due date)
2. Submit the form

**Expected Results:**
- ✅ Task is created successfully
- ✅ Task persists after refresh
- ✅ Description is visible
- ✅ Task can be moved to other columns

### TC-004: Create Task in Non-To-Do Column (Should Fail)
**Steps:**
1. Try to create a task in "In-Progress", "Review", or "Done" column

**Expected Results:**
- ✅ Task creation is blocked
- ✅ Error message: "Tasks can only be created in the 'To-Do' column"
- ✅ No task is created

---

## Test Suite 2: Task Dragging and Real-Time Updates

### TC-005: Drag Task from To-Do to In-Progress
**Steps:**
1. Create a task in "To-Do" column
2. Drag the task to "In-Progress" column
3. Observe the task behavior

**Expected Results:**
- ✅ Task moves immediately (real-time update)
- ✅ Task appears in "In-Progress" column instantly
- ✅ Task does NOT turn grey (not locked)
- ✅ Task persists after page refresh
- ✅ Task persists after logout/login
- ✅ Task remains in "In-Progress" column
- ✅ Task can still be edited
- ✅ Task can be dragged to other columns

### TC-006: Drag Task from In-Progress to Review
**Steps:**
1. Have a task in "In-Progress" column
2. Drag it to "Review" column

**Expected Results:**
- ✅ Task moves immediately (real-time update)
- ✅ Task does NOT turn grey
- ✅ Task persists correctly
- ✅ Task order is maintained

### TC-007: Drag Task to Done Column (Should Lock)
**Steps:**
1. Have a task in any column (except Done)
2. Drag it to "Done" column

**Expected Results:**
- ✅ Task moves immediately (real-time update)
- ✅ Task turns grey (locked appearance)
- ✅ Task shows lock icon
- ✅ Task is marked as `locked: true`
- ✅ `movedToDoneAt` timestamp is set
- ✅ Task persists after refresh
- ✅ Task cannot be edited (locked)
- ✅ Task can still be deleted
- ✅ Task shows auto-delete countdown

### TC-008: Drag Task from Done to Another Column (Should Unlock)
**Steps:**
1. Have a locked task in "Done" column
2. Drag it to "In-Progress" or "Review" column

**Expected Results:**
- ✅ Task moves immediately (real-time update)
- ✅ Task does NOT turn grey (unlocked)
- ✅ Task is marked as `locked: false`
- ✅ `movedToDoneAt` is set to `null`
- ✅ Task can be edited again
- ✅ Task persists correctly

### TC-009: Drag Task Within Same Column (Reorder)
**Steps:**
1. Have multiple tasks in "To-Do" column
2. Drag a task to a different position in the same column

**Expected Results:**
- ✅ Task order updates immediately
- ✅ Task order persists after refresh
- ✅ Task order persists after logout/login

### TC-010: Drag Task to Empty Column
**Steps:**
1. Have an empty column (e.g., "Review")
2. Drag a task from another column to the empty column

**Expected Results:**
- ✅ Task appears in the empty column immediately
- ✅ Task is placed at position 0 (first position)
- ✅ Task persists correctly

---

## Test Suite 3: Task Locking Behavior

### TC-011: Task Locked in Done Column
**Steps:**
1. Move a task to "Done" column
2. Try to edit the task

**Expected Results:**
- ✅ Edit button is disabled or shows "Edit (Locked)"
- ✅ Clicking edit shows alert: "This task is locked. Tasks in the 'Done' column cannot be edited."
- ✅ Task cannot be dragged (or dragging is disabled)

### TC-012: Task Unlocked When Moved from Done
**Steps:**
1. Have a locked task in "Done" column
2. Move it to "In-Progress" column
3. Try to edit the task

**Expected Results:**
- ✅ Task is unlocked
- ✅ Edit button is enabled
- ✅ Task can be edited successfully
- ✅ Task can be dragged again

### TC-013: Auto-Delete Countdown for Done Tasks
**Steps:**
1. Move a task to "Done" column
2. Observe the task card

**Expected Results:**
- ✅ Task shows "Auto-delete in: Xh Ym" countdown
- ✅ Countdown updates every minute
- ✅ Countdown shows time until 24 hours after `movedToDoneAt`

---

## Test Suite 4: Column Order Persistence

### TC-014: Reorder Columns
**Steps:**
1. Drag a column (e.g., "Review") to a different position
2. Refresh the page

**Expected Results:**
- ✅ Column order updates immediately
- ✅ Column order persists after refresh
- ✅ Column order persists after logout/login

### TC-015: Column Order with Tasks
**Steps:**
1. Reorder columns
2. Verify tasks remain in their respective columns

**Expected Results:**
- ✅ Tasks stay in their original columns
- ✅ Column order is maintained
- ✅ Task order within columns is maintained

---

## Test Suite 5: Edge Cases and Error Handling

### TC-016: Drag Locked Task (Should Fail)
**Steps:**
1. Have a locked task in "Done" column
2. Try to drag it to another column

**Expected Results:**
- ✅ Task cannot be dragged (or shows error)
- ✅ Task remains in "Done" column
- ✅ Task remains locked

**Note:** Based on current implementation, locked tasks can be moved away from Done to unlock them. This is expected behavior.

### TC-017: Rapid Task Movements
**Steps:**
1. Quickly drag a task between multiple columns
2. Observe the behavior

**Expected Results:**
- ✅ Each movement updates immediately
- ✅ No visual glitches or grey states
- ✅ Final position is correct
- ✅ All movements persist correctly

### TC-018: Network Error During Drag
**Steps:**
1. Disable network (or simulate network error)
2. Drag a task to a new column

**Expected Results:**
- ✅ Optimistic update shows task in new position
- ✅ On error, task reverts to original position
- ✅ Error is logged to console
- ✅ User can retry the operation

### TC-019: Multiple Tasks in Same Column
**Steps:**
1. Create multiple tasks in "To-Do" column
2. Drag tasks to different positions
3. Refresh the page

**Expected Results:**
- ✅ All tasks persist correctly
- ✅ Task order is maintained
- ✅ No tasks are lost or duplicated

### TC-020: Task Persistence Across Sessions
**Steps:**
1. Create and move tasks to various columns
2. Log out
3. Log back in

**Expected Results:**
- ✅ All tasks are in their correct columns
- ✅ Task order is maintained
- ✅ Locked status is correct
- ✅ No tasks are missing

---

## Test Suite 6: Visual Feedback and UI

### TC-021: Task Visual State - Normal Task
**Steps:**
1. Create a task in "To-Do" column
2. Observe the task card

**Expected Results:**
- ✅ Task has normal background (white/dark mode appropriate)
- ✅ Task has normal border color
- ✅ No lock icon visible
- ✅ Task is draggable

### TC-022: Task Visual State - Locked Task
**Steps:**
1. Move a task to "Done" column
2. Observe the task card

**Expected Results:**
- ✅ Task has grey background (`bg-gray-50 dark:bg-gray-800/50`)
- ✅ Task has grey border (`border-gray-300 dark:border-gray-600`)
- ✅ Lock icon is visible
- ✅ Task title has line-through styling
- ✅ Task shows opacity reduction

### TC-023: Task Visual State - Dragging
**Steps:**
1. Start dragging a task
2. Observe the drag overlay and task

**Expected Results:**
- ✅ Drag overlay shows task preview
- ✅ Original task shows reduced opacity
- ✅ Smooth drag animation
- ✅ Task follows cursor smoothly

---

## Test Suite 7: Data Integrity

### TC-024: Task Data Consistency
**Steps:**
1. Create a task with all fields (title, description, due date)
2. Move it between columns
3. Refresh and verify

**Expected Results:**
- ✅ All task data persists (title, description, due date)
- ✅ Task data is not corrupted
- ✅ Task data matches database

### TC-025: Task Order Integrity
**Steps:**
1. Create 5 tasks in "To-Do" column
2. Reorder them multiple times
3. Refresh the page

**Expected Results:**
- ✅ All tasks are present
- ✅ Task order matches last drag operation
- ✅ No duplicate tasks
- ✅ Order values are sequential (0, 1, 2, 3, 4)

---

## Manual Test Execution Checklist

Use this checklist when manually testing:

```
Task Creation:
[ ] TC-001: Create Task in To-Do Column
[ ] TC-002: Create Task with No Due Date
[ ] TC-003: Create Task with Description but No Due Date
[ ] TC-004: Create Task in Non-To-Do Column (Should Fail)

Task Dragging:
[ ] TC-005: Drag Task from To-Do to In-Progress
[ ] TC-006: Drag Task from In-Progress to Review
[ ] TC-007: Drag Task to Done Column (Should Lock)
[ ] TC-008: Drag Task from Done to Another Column (Should Unlock)
[ ] TC-009: Drag Task Within Same Column (Reorder)
[ ] TC-010: Drag Task to Empty Column

Task Locking:
[ ] TC-011: Task Locked in Done Column
[ ] TC-012: Task Unlocked When Moved from Done
[ ] TC-013: Auto-Delete Countdown for Done Tasks

Column Order:
[ ] TC-014: Reorder Columns
[ ] TC-015: Column Order with Tasks

Edge Cases:
[ ] TC-016: Drag Locked Task
[ ] TC-017: Rapid Task Movements
[ ] TC-018: Network Error During Drag
[ ] TC-019: Multiple Tasks in Same Column
[ ] TC-020: Task Persistence Across Sessions

Visual Feedback:
[ ] TC-021: Task Visual State - Normal Task
[ ] TC-022: Task Visual State - Locked Task
[ ] TC-023: Task Visual State - Dragging

Data Integrity:
[ ] TC-024: Task Data Consistency
[ ] TC-025: Task Order Integrity
```

---

## Automated Test Script

See `task-persistence.test.ts` for automated test implementation.

---

## Known Issues to Verify Fixed

1. ✅ Task turns grey when dragged to new column (should only be grey in Done)
2. ✅ Task doesn't update in real time (should update immediately)
3. ✅ Task doesn't persist (should persist after refresh)
4. ✅ Task locked status incorrect (should only lock in Done)

---

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: ___________

Results:
- Total Tests: 25
- Passed: ___
- Failed: ___
- Skipped: ___

Failed Tests:
1. TC-XXX: [Description]
   Issue: [Details]

Notes:
[Any additional observations]
```
