# 🎓 Kibble

A lightweight, full-stack web application designed to help students organize coursework and manage academic deadlines. Kibble features secure data isolation for each user, class-based task categories, and a visual Kanban board for tracking progress with intelligent alerts.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Core Architecture](#-core-architecture)
- [Complex Logic Documentation](#-complex-logic-documentation)
- [API Routes](#-api-routes)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Deployment](#-deployment)
- [Development](#-development)

## ✨ Features

### 📚 Class-Based Task Management
- **Multiple Boards**: Create separate boards for different classes or subjects
- **Organized Structure**: Each board contains its own columns and tasks
- **Easy Navigation**: Quick access to all your classes via sidebar
- **Board CRUD**: Create, edit, and delete boards with confirmation dialogs

### 📋 Kanban Board
- **Drag & Drop**: Intuitive drag-and-drop interface for task and column management
- **Multiple Views**: Switch between Kanban, Table, Grid, and List views
- **Task Organization**: Organize tasks across columns (To-Do, In-Progress, Review, Done)
- **Task Locking**: Tasks automatically lock when moved to "Done" column
- **Auto-Cleanup**: Tasks in "Done" column are automatically deleted after 24 hours
- **Column Reordering**: Drag columns to reorder them horizontally

### 🔔 Intelligent Alerts
- **Due Date Alerts**: Real-time notifications for upcoming and overdue tasks
- **Completion Alerts**: Celebrate task completions with visual feedback
- **Smart Notifications**: Contextual alerts based on task status and deadlines
- **Browser Notifications**: Native browser notifications with permission management
- **Alert Persistence**: Alerts persist across page refreshes

### 🔒 Security & Privacy
- **User Authentication**: Secure email/password authentication with NextAuth.js
- **Data Isolation**: Each user's data is completely isolated and secure
- **Permission System**: Comprehensive permission checks for all operations
- **Secure Sessions**: JWT-based session management
- **Input Validation**: Zod schema validation on all inputs

### 🎨 User Experience
- **Dark Mode**: Beautiful dark and light themes with system preference detection
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Polished UI with Framer Motion animations
- **Real-time Updates**: Optimistic UI updates for instant feedback
- **Accessibility**: ARIA labels and keyboard navigation support

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with hooks
- **TypeScript 5.9** - Type safety
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion 12** - Animation library
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js v5** - Authentication and session management
- **Prisma 6.19** - Next-generation ORM
- **PostgreSQL** - Relational database
- **bcryptjs** - Password hashing
- **Zod** - Schema validation

### Drag & Drop
- **@dnd-kit/core** - Drag and drop core library
- **@dnd-kit/sortable** - Sortable components
- **@dnd-kit/utilities** - Utility functions

### Development Tools
- **Vitest** - Unit testing framework
- **ESLint** - Code linting
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (or 22+)
- **PostgreSQL** database (local or hosted on Supabase)
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kibble
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database Connection
   DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   
   # NextAuth Configuration
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   ```
   
   Generate `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

4. **Set up the database**
   
   Generate Prisma Client:
   ```bash
   npm run db:generate
   ```
   
   Run database migrations:
   ```bash
   npm run db:migrate
   ```
   
   Or push schema directly (development only):
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
kibble/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (serverless functions)
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── [...nextauth]/    # NextAuth.js handlers
│   │   │   └── register/         # User registration
│   │   ├── boards/               # Board CRUD operations
│   │   │   ├── [id]/             # Individual board operations
│   │   │   ├── list/             # List all user's boards
│   │   │   └── user/             # Get user's first board
│   │   ├── columns/              # Column management
│   │   │   └── [id]/             # Column update (reordering)
│   │   ├── tasks/                # Task operations
│   │   │   ├── [id]/             # Individual task operations
│   │   │   └── cleanup/          # Auto-deletion cleanup
│   │   └── user/                 # User management
│   │       └── delete/           # Account deletion
│   ├── auth/                     # Authentication pages
│   │   └── signin/               # Sign-in page
│   ├── settings/                 # Settings page
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Main dashboard
│   ├── providers.tsx              # Context providers wrapper
│   └── globals.css                # Global styles
├── components/                    # React components
│   ├── kanban-board.tsx           # Main Kanban board component
│   ├── kanban-column.tsx          # Column component
│   ├── kanban-task.tsx            # Task card component
│   ├── board-table-view.tsx      # Table view implementation
│   ├── board-grid-view.tsx       # Grid view implementation
│   ├── board-list-view.tsx       # List view implementation
│   ├── layout-selector.tsx       # View mode selector
│   ├── sidebar.tsx               # Navigation sidebar
│   ├── notification-system.tsx    # Alert notification panel
│   ├── create-board-dialog.tsx   # Board creation dialog
│   ├── edit-board-dialog.tsx     # Board editing dialog
│   ├── edit-task-dialog.tsx      # Task editing dialog
│   └── delete-confirmation-dialog.tsx # Confirmation dialogs
├── contexts/                      # React contexts
│   ├── alert-context.tsx          # Alert management context
│   ├── layout-context.tsx        # Layout preferences context
│   └── theme-context.tsx         # Theme management context
├── lib/                           # Utilities and helpers
│   ├── db.ts                     # Prisma client (singleton)
│   ├── auth.ts                   # NextAuth configuration
│   ├── permissions.ts            # Permission checking utilities
│   ├── alert-utils.ts            # Alert calculation and formatting
│   └── types.ts                  # TypeScript type definitions
├── server/                        # Server-side utilities
│   └── auth.ts                   # Auth session helper
├── prisma/                        # Database schema
│   ├── schema.prisma             # Prisma schema definition
│   └── migrations/                # Database migrations
├── tests/                         # Test files
├── public/                        # Static assets
├── types/                         # Type definitions
│   └── next-auth.d.ts            # NextAuth type extensions
├── scripts/                       # Utility scripts
│   └── test-db-connection.ts    # Database connection test
├── next.config.js                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── vercel.json                    # Vercel deployment configuration
└── package.json                   # Dependencies and scripts
```

## 🏗️ Core Architecture

### Application Flow

1. **Authentication**: User signs in via NextAuth.js → JWT session created
2. **Board Selection**: User selects a board → Board data fetched from API
3. **Task Management**: User creates/edits/moves tasks → Optimistic UI updates → Database persistence
4. **Alerts**: System checks due dates → Alerts generated → Browser notifications shown
5. **Auto-Cleanup**: Background process deletes tasks in Done column after 24 hours

### State Management

- **Server State**: Managed via API routes and Prisma
- **Client State**: React hooks (`useState`, `useCallback`, `useMemo`)
- **Global State**: React Context API (alerts, layout, theme)
- **Persistence**: localStorage for board selection, database for all data

### Data Flow

```
User Action → Component → API Route → Permission Check → Database → Response → UI Update
```

## 🧠 Complex Logic Documentation

### 1. Drag and Drop Algorithm

**Location**: `components/kanban-board.tsx` - `handleDragEnd` function

The drag-and-drop system handles both task and column reordering with complex order recalculation.

#### Task Dragging Logic

**Algorithm Steps:**

1. **Determine Drop Target**:
   ```typescript
   // Check if dropped on column or another task
   const targetColumn = board.columns.find(col => col.id === overId);
   if (targetColumn) {
     // Dropped on column - place at end
     newOrder = maxOrderInColumn + 1;
   } else {
     // Dropped on task - insert at that task's position
     newOrder = overTask.order;
   }
   ```

2. **Optimistic UI Update**:
   - Immediately updates local state for instant feedback
   - Creates deep copy of board structure to ensure React detects changes
   - Removes task from source column, adds to target column
   - Recalculates order for all affected tasks

3. **Database Order Recalculation**:
   ```typescript
   // Shift tasks in target column to make room
   await db.task.updateMany({
     where: {
       columnId: finalColumnId,
       order: { gte: adjustedOrder },
       id: { not: existingTask.id },
     },
     data: { order: { increment: 1 } },
   });
   
   // Decrement orders in source column
   await db.task.updateMany({
     where: {
       columnId: existingTask.columnId,
       order: { gt: existingTask.order },
     },
     data: { order: { decrement: 1 } },
   });
   ```

4. **Task Locking**:
   - If moving TO "Done" column: `locked = true`, `movedToDoneAt = new Date()`
   - If moving FROM "Done" column: `locked = false`, `movedToDoneAt = null`

5. **Verification**:
   - After database update, verifies the change persisted correctly
   - Refetches board to ensure consistency

**Complexity**: O(n) where n is the number of tasks in affected columns

#### Column Reordering Logic

**Algorithm Steps:**

1. **Calculate New Position**:
   ```typescript
   const sortedCols = [...board.columns].sort((a, b) => a.order - b.order);
   const draggedIndex = sortedCols.findIndex(col => col.id === activeId);
   const overIndex = sortedCols.findIndex(col => col.id === overId);
   newOrder = overIndex; // Place at target's position
   ```

2. **Shift Other Columns**:
   ```typescript
   if (oldOrder < newOrder) {
     // Moving right - decrement columns between old and new
     await db.column.updateMany({
       where: {
         boardId,
         order: { gt: oldOrder, lte: newOrder },
         id: { not: id },
       },
       data: { order: { decrement: 1 } },
     });
   } else {
     // Moving left - increment columns between new and old
     await db.column.updateMany({
       where: {
         boardId,
         order: { gte: newOrder, lt: oldOrder },
         id: { not: id },
       },
       data: { order: { increment: 1 } },
     });
   }
   ```

### 2. Task Locking and Auto-Deletion System

**Location**: `app/api/tasks/[id]/route.ts` - Task update logic

#### Locking Mechanism

When a task is moved to the "Done" column:

```typescript
if (newColumn.title === "Done") {
  updateData.locked = true;
  updateData.movedToDoneAt = new Date();
}
```

**Locked Task Behavior**:
- Cannot be edited (title, description, due date)
- Cannot be dragged (disabled in drag handler)
- Shows lock icon and strikethrough text
- Displays countdown timer until deletion

#### Auto-Deletion Algorithm

**Location**: `app/api/tasks/cleanup/route.ts`

**Process**:

1. **Calculate Cutoff Time**:
   ```typescript
   const twentyFourHoursAgo = new Date();
   twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
   ```

2. **Find Tasks to Delete**:
   ```typescript
   const doneColumns = await db.column.findMany({
     where: {
       title: "Done",
       board: { userId: session.user.id },
     },
     include: {
       tasks: {
         where: {
           movedToDoneAt: { lte: twentyFourHoursAgo },
           locked: true,
         },
       },
     },
   });
   ```

3. **Batch Deletion**:
   ```typescript
   await db.task.deleteMany({
     where: { id: { in: taskIdsToDelete } },
   });
   ```

**Client-Side Countdown**:
- Location: `components/kanban-task.tsx`
- Updates every minute showing time until deletion
- Format: "Xh Ym" or "Ym" if less than 1 hour

### 3. Order Recalculation Algorithm

**Location**: `app/api/tasks/[id]/route.ts` - Order recalculation logic

This is one of the most complex parts of the system, handling order updates when tasks are moved.

#### Moving Between Columns

**Algorithm**:

1. **Get Target Column Tasks** (excluding moved task):
   ```typescript
   const newColumnTasks = await db.task.findMany({
     where: { 
       columnId: finalColumnId,
       id: { not: existingTask.id },
     },
     orderBy: { order: "asc" },
   });
   ```

2. **Adjust Order**:
   ```typescript
   let adjustedOrder = finalOrder;
   if (finalOrder > newColumnTasks.length) {
     adjustedOrder = newColumnTasks.length; // Clamp to end
   }
   adjustedOrder = Math.max(0, adjustedOrder); // Ensure non-negative
   ```

3. **Shift Tasks in Target Column**:
   ```typescript
   // Increment orders for tasks at or after insertion point
   await db.task.updateMany({
     where: {
       columnId: finalColumnId,
       order: { gte: adjustedOrder },
       id: { not: existingTask.id },
     },
     data: { order: { increment: 1 } },
   });
   ```

4. **Decrement Orders in Source Column**:
   ```typescript
   await db.task.updateMany({
     where: {
       columnId: existingTask.columnId,
       order: { gt: existingTask.order },
     },
     data: { order: { decrement: 1 } },
   });
   ```

#### Reordering Within Same Column

**Algorithm**:

1. **Determine Direction**:
   ```typescript
   if (oldOrder < adjustedOrder) {
     // Moving down - decrement orders between old and new
   } else if (oldOrder > adjustedOrder) {
     // Moving up - increment orders between new and old
   }
   ```

2. **Shift Affected Tasks**:
   ```typescript
   // Moving down example
   await db.task.updateMany({
     where: {
       columnId: existingTask.columnId,
       order: { gt: oldOrder, lte: adjustedOrder },
       id: { not: existingTask.id },
     },
     data: { order: { decrement: 1 } },
   });
   ```

**Complexity**: O(n) database operations where n is number of affected tasks

### 4. Optimistic UI Updates

**Location**: `components/kanban-board.tsx` - `handleDragEnd` function

**Pattern**: Update UI immediately, then sync with server

**Implementation**:

```typescript
// 1. Update local state immediately
const updatedBoard: Board = {
  ...board,
  columns: board.columns.map(col => {
    // Remove from source, add to target
    // Recalculate orders
  }),
};
setBoard(updatedBoard);

// 2. Persist to database
const response = await fetch(`/api/tasks/${taskId}`, {
  method: "PATCH",
  body: JSON.stringify({ columnId: newColumnId, order: newOrder }),
});

// 3. Refetch to ensure consistency
await fetchBoard();
```

**Benefits**:
- Instant user feedback
- Perceived performance improvement
- Automatic rollback on error (via refetch)

### 5. Alert System Architecture

**Location**: `lib/alert-utils.ts`, `contexts/alert-context.tsx`, `components/notification-system.tsx`

#### Alert Generation

**Due Date Alert Logic**:

```typescript
function checkTaskAlert(task: Task): Alert | null {
  if (!task.dueDate) return null;
  
  const daysUntil = calculateDaysUntil(dueDate);
  const urgency = getAlertUrgency(daysUntil);
  
  // Alert if overdue, due today, due tomorrow, or due within 10 days
  if (daysUntil < 0 || daysUntil === 0 || daysUntil === 1 || daysUntil <= 10) {
    return {
      id: `alert-${task.id}-${daysUntil <= 0 ? 'overdue' : daysUntil}`,
      type: 'urgent',
      color: 'red',
      // ... other fields
    };
  }
  return null;
}
```

**Completion Alert Logic**:

```typescript
function createCompletionAlert(task: Task): Alert {
  return {
    id: `completion-${task.id}`,
    type: 'completion',
    color: 'green',
    // ... other fields
  };
}
```

#### Duplicate Prevention

**Stable ID Generation**:
- Due date alerts: `alert-{taskId}-{daysUntil}`
- Completion alerts: `completion-{taskId}`

**Context-Level Deduplication**:
```typescript
const exists = prev.some(
  (a) => a.id === alert.id && !a.closed
);
if (exists) return prev; // Prevent duplicate
```

#### Browser Notification System

**Permission Management**:
```typescript
async function requestNotificationPermission(): Promise<NotificationPermission> {
  // Security checks
  if (!window.isSecureContext) return 'denied';
  if (!('Notification' in window)) return 'denied';
  
  // Request permission
  return await Notification.requestPermission();
}
```

**Notification Tagging**:
- Uses stable tags to prevent duplicate browser notifications
- Same tag = browser replaces existing notification
- Tracks sent notifications to prevent duplicates

### 6. Table View Alignment Logic

**Location**: `components/board-table-view.tsx`

**Problem**: After dragging tasks, the checkmark indicator could appear in the wrong column.

**Solution**: Use `actualColumnId` derived from the column where the task is found:

```typescript
const allTasks = useMemo(() => {
  const tasks: Array<Task & { actualColumnId: string }> = [];
  sortedColumns.forEach((column) => {
    column.tasks.forEach((task) => {
      // Use column.id where task was found as source of truth
      tasks.push({ ...task, column, actualColumnId: column.id });
    });
  });
  return tasks;
}, [sortedColumns]);

// Render checkmark based on actualColumnId
{sortedColumns.map((column) => {
  const isInColumn = task.actualColumnId === column.id;
  return (
    <td key={column.id}>
      {isInColumn && <span>✓</span>}
    </td>
  );
})}
```

**Why This Works**: The board data structure already has tasks nested in their correct columns, so we use that as the source of truth rather than `task.columnId` which might be stale.

### 7. Permission System

**Location**: `lib/permissions.ts`

**Architecture**: Layered permission checks

#### Permission Check Flow

```
API Route → checkAuthentication() → checkResourceOwnership() → Database Query
```

#### Permission Functions

1. **Authentication Check**:
   ```typescript
   function checkAuthentication(session: Session | null): PermissionResult {
     if (!session?.user?.id) {
       return { allowed: false, error: "Unauthorized", statusCode: 401 };
     }
     return { allowed: true };
   }
   ```

2. **Board Ownership Check**:
   ```typescript
   async function checkBoardOwnership(boardId: string, userId: string) {
     const board = await db.board.findUnique({
       where: { id: boardId },
       select: { userId: true },
     });
     
     if (board?.userId !== userId) {
       return { allowed: false, error: "Forbidden", statusCode: 403 };
     }
     return { allowed: true };
   }
   ```

3. **Task Ownership Check** (via board):
   ```typescript
   async function checkTaskOwnership(taskId: string, userId: string) {
     const task = await db.task.findUnique({
       where: { id: taskId },
       include: {
         column: {
           include: {
             board: { select: { userId: true } },
           },
         },
       },
     });
     
     if (task?.column.board.userId !== userId) {
       return { allowed: false, error: "Forbidden", statusCode: 403 };
     }
     return { allowed: true };
   }
   ```

**Comprehensive Permission Functions**:
- `checkBoardPermission()` - Combines auth + board ownership
- `checkTaskPermission()` - Combines auth + task ownership
- `checkColumnPermission()` - Combines auth + column ownership
- `checkColumnBoardMatch()` - Validates task can be moved to target column

### 8. Prisma Client Singleton Pattern

**Location**: `lib/db.ts`

**Problem**: In serverless environments (Vercel), each function invocation could create a new Prisma client, leading to connection exhaustion.

**Solution**: Singleton pattern with global instance reuse:

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Store in global scope to reuse across invocations
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
} else {
  // In production (serverless), also store in global
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = db;
  }
}
```

**Benefits**:
- Prevents connection exhaustion
- Reuses connections across serverless invocations
- Works in both development and production

### 9. Column Width Calculation

**Location**: `components/kanban-board.tsx` - `columnWidthStyle` useMemo

**Problem**: Columns need to fit on one page while maintaining readability.

**Solution**: Dynamic width calculation based on column count:

```typescript
const columnWidthStyle = useMemo(() => {
  if (columnCount === 0) return { width: '100%' };
  
  // For 4 or fewer columns: equal distribution
  if (columnCount <= 4) {
    return { 
      flex: '1 1 0%', // Equal distribution
      minWidth: 0,
      maxWidth: '100%',
    };
  }
  
  // For more than 4 columns: calculated width with scroll
  const totalGaps = columnCount - 1;
  return {
    width: `clamp(200px, calc((100% - 2.5rem - ${totalGaps}rem) / ${columnCount}), 350px)`,
    minWidth: '200px',
    maxWidth: '350px',
    flexShrink: 0,
  };
}, [columnCount]);
```

**Formula**: `(container width - padding - gaps) / column count`, clamped between 200px and 350px

### 10. View Mode System

**Location**: `contexts/layout-context.tsx`, `components/layout-selector.tsx`

**Supported Views**:
- **Kanban**: Traditional column-based board with drag-and-drop
- **Table**: Spreadsheet-like view with checkmarks
- **Grid**: Card-based grid layout
- **List**: Compact list format

**Implementation**:
- Context stores current layout preference
- Layout selector component switches between views
- Each view component receives same board data
- Views are conditionally rendered based on context

### 11. Task Creation Restriction

**Location**: `components/kanban-column.tsx`, `app/api/tasks/route.ts`

**Rule**: Tasks can only be created in the "To-Do" column.

**Client-Side**:
```typescript
const canCreateTasks = column.title === "To-Do";

// Only show "Add task" button in To-Do column
{canCreateTasks ? (
  <button onClick={() => setIsAddingTask(true)}>+ Add task</button>
) : null}
```

**Server-Side Validation**:
```typescript
if (column.title !== "To-Do") {
  return NextResponse.json(
    { error: "Tasks can only be created in the 'To-Do' column" },
    { status: 400 }
  );
}
```

**Rationale**: Enforces workflow - all tasks start in To-Do, then progress through columns.

### 12. Auto-Cleanup Scheduling

**Location**: `components/kanban-board.tsx` - useEffect hook

**Implementation**:
```typescript
useEffect(() => {
  // Periodic cleanup every 5 minutes
  const cleanupInterval = setInterval(async () => {
    await fetch("/api/tasks/cleanup", { method: "POST" });
    await fetchBoard(); // Refresh board after cleanup
  }, 5 * 60 * 1000);
  
  // Initial cleanup on mount
  const initialCleanup = async () => {
    await fetch("/api/tasks/cleanup", { method: "POST" });
    await fetchBoard();
  };
  initialCleanup();
  
  return () => clearInterval(cleanupInterval);
}, [fetchBoard]);
```

**Process**:
1. Runs immediately on component mount
2. Runs every 5 minutes thereafter
3. Deletes tasks in Done column older than 24 hours
4. Refetches board to reflect changes

## 🔌 API Routes

All API routes are optimized for Vercel serverless with:
- `export const runtime = "nodejs"`
- `export const dynamic = "force-dynamic"`
- `export const maxDuration = 30`

### Authentication Routes

#### `POST /api/auth/register`
- Creates new user account
- Validates email format and password strength (8+ characters)
- Hashes password with bcrypt
- Returns generic error messages (security)

#### `GET/POST /api/auth/[...nextauth]`
- NextAuth.js handlers
- JWT session management
- Credentials provider

### Board Routes

#### `GET /api/boards/list`
- Returns all user's boards
- Filters by `userId`
- Ordered by creation date (newest first)

#### `POST /api/boards`
- Creates new board with default columns
- Default columns: To-Do, In-Progress, Review, Done
- Returns created board

#### `GET /api/boards/[id]`
- Fetches board with all columns and tasks
- Permission check: user must own the board
- Includes nested relations (columns → tasks)

#### `PATCH /api/boards/[id]`
- Updates board title
- Permission check required
- Validates title is non-empty string

#### `DELETE /api/boards/[id]`
- Deletes board (cascade deletes columns and tasks)
- Permission check required
- Clears localStorage if deleted board was selected

#### `GET /api/boards/user`
- Returns user's first board (by creation date)
- Used for initial board selection

### Task Routes

#### `POST /api/tasks`
- Creates new task
- **Restriction**: Only in "To-Do" column
- Calculates order (max order + 1)
- Validates title and columnId

#### `PATCH /api/tasks/[id]`
- Updates task (title, description, dueDate, columnId, order)
- **Complex Logic**: Order recalculation (see above)
- **Task Locking**: Auto-locks when moved to Done
- **Verification**: Double-checks update persisted

#### `DELETE /api/tasks/[id]`
- Deletes task
- Permission check required

#### `POST /api/tasks/cleanup`
- Deletes tasks in Done column older than 24 hours
- Batch deletion for efficiency
- Returns count of deleted tasks

#### `GET /api/tasks/cleanup`
- Returns tasks approaching 24-hour mark
- Used for preview/notification purposes

### Column Routes

#### `POST /api/columns`
- Creates new column
- Calculates order (max order + 1)

#### `PATCH /api/columns/[id]`
- Updates column order
- **Complex Logic**: Shifts other columns' orders
- Used for column reordering via drag-and-drop

### User Routes

#### `DELETE /api/user/delete`
- Deletes user account and all associated data
- Requires password re-authentication
- Cascade deletes: boards → columns → tasks

## 🗄️ Database Schema

### Models

#### User
- `id`: Unique identifier (cuid)
- `email`: Unique email address
- `password`: Hashed password (bcrypt)
- `name`: Optional display name
- `mfaEnabled`: Multi-factor authentication flag
- Relations: `boards`, `accounts`, `sessions`

#### Board
- `id`: Unique identifier
- `title`: Board name
- `userId`: Owner reference
- Relations: `columns`, `user`
- Indexes: `userId`

#### Column
- `id`: Unique identifier
- `title`: Column name (e.g., "To-Do", "Done")
- `order`: Display order (0, 1, 2, 3...)
- `boardId`: Parent board reference
- Relations: `tasks`, `board`
- Indexes: `boardId`

#### Task
- `id`: Unique identifier
- `title`: Task title (required)
- `description`: Optional task description
- `dueDate`: Optional due date
- `order`: Position within column (0, 1, 2...)
- `columnId`: Parent column reference
- `locked`: Lock status (true when in Done column)
- `movedToDoneAt`: Timestamp when moved to Done (for auto-deletion)
- Relations: `column`
- Indexes: `columnId`, `dueDate`, `movedToDoneAt`, `locked`

### Relationships

```
User → Board (1:many)
Board → Column (1:many)
Column → Task (1:many)
```

All relationships use `onDelete: Cascade` for automatic cleanup.

## 🔒 Security

### Authentication
- **NextAuth.js v5**: Industry-standard authentication
- **bcryptjs**: Password hashing (secure, slow hashing)
- **JWT Sessions**: Stateless session management
- **Email Verification**: Required for account activation

### Authorization
- **Permission System**: All API routes check permissions
- **Resource Ownership**: Users can only access their own data
- **Horizontal Access Control**: Prevents IDOR (Insecure Direct Object Reference)
- **Server-Side Only**: All permission checks happen server-side

### Input Validation
- **Zod Schemas**: Type-safe validation
- **String Sanitization**: Trims whitespace, validates types
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: React's built-in XSS protection

### Error Handling
- **Generic Messages**: No sensitive data in error responses
- **Development vs Production**: Detailed errors only in development
- **Fail Securely**: Default to denying access

## 🌐 Deployment

### Vercel (Recommended)

Kibble is optimized for Vercel serverless deployment.

**Configuration** (`vercel.json`):
```json
{
  "buildCommand": "prisma generate && next build",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

**Environment Variables** (set in Vercel Dashboard):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generated secret (32+ characters)
- `NEXTAUTH_URL`: Production URL

**Database Setup**:
1. Use Supabase or any PostgreSQL provider
2. Get direct connection string (port 5432)
3. Set as `DATABASE_URL` in Vercel
4. Run migrations: `npx prisma migrate deploy`

### Build Process

1. **Prisma Generate**: Generates Prisma Client
2. **Next.js Build**: Compiles application
3. **Optimization**: Tree-shaking, code splitting, image optimization

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run migrations
npm run db:push      # Push schema (dev only)
npm run db:studio    # Open Prisma Studio
npm run db:test      # Test database connection

# Testing
npm run test         # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
npm run test:coverage # Run with coverage
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Formatting**: Consistent indentation and naming
- **Comments**: JSDoc comments for complex functions

### Testing

Test files are located in `tests/` directory:
- `auth.test.ts` - Authentication tests
- `auth-security.test.ts` - Security tests
- `api-tasks.test.ts` - Task API tests
- `permissions.test.ts` - Permission system tests
- `task-persistence.test.ts` - Task persistence tests
- `column-behavior.test.ts` - Column behavior tests
- `due-date-alerts.test.ts` - Alert system tests
- `account-deletion.test.ts` - Account deletion tests

## 📚 Key Design Decisions

### Why Optimistic UI Updates?

- **User Experience**: Instant feedback feels more responsive
- **Perceived Performance**: Users see changes immediately
- **Error Handling**: Automatic rollback via refetch on error

### Why Task Locking?

- **Workflow Enforcement**: Prevents editing completed tasks
- **Data Integrity**: Ensures Done tasks remain unchanged
- **Auto-Cleanup**: Enables automatic deletion after 24 hours

### Why Only Create Tasks in To-Do?

- **Workflow**: Enforces proper task progression
- **Organization**: All tasks start in the same place
- **Clarity**: Clear entry point for new tasks

### Why Multiple View Modes?

- **User Preference**: Different users prefer different views
- **Use Cases**: Table view for data analysis, Kanban for workflow
- **Accessibility**: Some users find certain views easier to use

### Why Singleton Prisma Client?

- **Serverless Optimization**: Prevents connection exhaustion
- **Performance**: Reuses connections across invocations
- **Resource Management**: Efficient connection pooling

## 🐛 Troubleshooting

### Database Connection Issues

**Error**: "Can't reach database server"
- Verify `DATABASE_URL` is correct
- Check database firewall allows connections
- Ensure password is correctly set

**Error**: "Too many connections"
- Verify Prisma singleton is working
- Check database connection limits
- Review connection pooling configuration

### Build Issues

**Error**: "Prisma Client not generated"
- Run `npm run db:generate` manually
- Check `postinstall` script in package.json
- Verify Prisma schema is valid

### Drag and Drop Issues

**Issue**: Tasks not moving correctly
- Check browser console for errors
- Verify API route is responding
- Check network tab for failed requests

### Alert Issues

**Issue**: Alerts not showing
- Check browser notification permissions
- Verify task has due date
- Check alert context is properly initialized

## 📖 Additional Resources

- **[REFERENCES.md](./REFERENCES.md)** - Official documentation links for all technologies

## 📝 License

ISC

---

**Made with ❤️ for students who want to stay organized**
