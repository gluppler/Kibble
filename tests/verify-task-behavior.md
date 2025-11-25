# Task Behavior Verification Guide

## Quick Verification Steps

### 1. Test Task Creation
```bash
# 1. Start the dev server
npm run dev

# 2. Navigate to http://localhost:3000
# 3. Login with test account
# 4. Create a task in "To-Do" column
```

**Expected:**
- ✅ Task appears immediately
- ✅ Task persists after refresh (F5)
- ✅ Task persists after logout/login

### 2. Test Task Dragging - Normal Column
```bash
# 1. Drag a task from "To-Do" to "In-Progress"
```

**Expected:**
- ✅ Task moves immediately (real-time)
- ✅ Task does NOT turn grey
- ✅ Task persists after refresh
- ✅ Task can still be edited

### 3. Test Task Dragging - To Done Column
```bash
# 1. Drag a task to "Done" column
```

**Expected:**
- ✅ Task moves immediately (real-time)
- ✅ Task turns grey (locked appearance)
- ✅ Task shows lock icon
- ✅ Task persists after refresh
- ✅ Task cannot be edited (locked)

### 4. Test Task Dragging - From Done Column
```bash
# 1. Drag a locked task from "Done" to "In-Progress"
```

**Expected:**
- ✅ Task moves immediately (real-time)
- ✅ Task does NOT turn grey (unlocked)
- ✅ Task persists after refresh
- ✅ Task can be edited again

### 5. Test Task Persistence
```bash
# 1. Create multiple tasks
# 2. Move them to different columns
# 3. Refresh the page (F5)
# 4. Logout and login again
```

**Expected:**
- ✅ All tasks are in correct columns
- ✅ Task order is maintained
- ✅ Locked status is correct
- ✅ No tasks are missing

## Browser Console Checks

Open browser DevTools (F12) and check console for:

### Expected Logs (Success):
```
[DRAG END] Updating task <id>: columnId=<newColumnId>, order=<newOrder>
[TASK UPDATE] Task <id> updated successfully
[BOARD FETCH] Board fetched successfully
```

### Error Logs (Should NOT appear):
```
[DRAG END] Failed to update task
[TASK UPDATE] CRITICAL ERROR: Update did not persist
```

## Database Verification

### Check Task in Database:
```sql
-- Connect to your database and run:
SELECT id, title, "columnId", "order", locked, "movedToDoneAt"
FROM "Task"
WHERE "columnId" IN (
  SELECT id FROM "Column" WHERE "boardId" = '<your-board-id>'
)
ORDER BY "columnId", "order";
```

**Expected:**
- ✅ Tasks have correct `columnId`
- ✅ Tasks have sequential `order` values (0, 1, 2, ...)
- ✅ Tasks in "Done" column have `locked = true`
- ✅ Tasks in other columns have `locked = false`
- ✅ Tasks in "Done" have `movedToDoneAt` timestamp

## API Endpoint Tests

### Test Task Update API:
```bash
# Update task column (replace <task-id> and <column-id>)
curl -X PATCH http://localhost:3000/api/tasks/<task-id> \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=<your-session-token>" \
  -d '{"columnId": "<column-id>", "order": 0}'
```

**Expected Response:**
```json
{
  "id": "<task-id>",
  "title": "Task Title",
  "columnId": "<new-column-id>",
  "order": 0,
  "locked": false,  // or true if moved to Done
  ...
}
```

## Visual Verification Checklist

- [ ] Task appears normal (white background) in non-Done columns
- [ ] Task appears grey (locked) only in Done column
- [ ] Lock icon visible only on locked tasks
- [ ] Task title has line-through only on locked tasks
- [ ] Drag animation is smooth
- [ ] No visual glitches during drag
- [ ] Task count updates correctly in column headers

## Common Issues and Solutions

### Issue: Task turns grey in wrong column
**Solution:** Check that optimistic update correctly identifies target column title

### Issue: Task doesn't persist
**Solution:** Check database update response and refetch logic

### Issue: Task order incorrect
**Solution:** Verify order calculation in `handleDragEnd`

### Issue: Locked status incorrect
**Solution:** Verify `isMovingToDone` logic in optimistic update

## Performance Checks

- [ ] Task moves instantly (no delay)
- [ ] No lag when dragging multiple tasks
- [ ] Page refresh is fast
- [ ] No memory leaks (check browser DevTools)

## Accessibility Checks

- [ ] Tasks are keyboard accessible
- [ ] Screen reader announces task movements
- [ ] Focus management is correct
- [ ] ARIA labels are present
