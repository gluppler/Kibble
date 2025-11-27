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
- **Board CRUD**: Create, edit, archive, and delete boards with confirmation dialogs
- **Board Archiving**: Archive boards to preserve history without deletion
- **Real-time Updates**: Archive changes sync across tabs and sessions

### 📋 Kanban Board
- **Drag & Drop**: Intuitive drag-and-drop interface for task and column management
- **Multiple Views**: Switch between Kanban, Table, Grid, and List views
- **Task Organization**: Organize tasks across columns (To-Do, In-Progress, Review, Done)
- **Task Locking**: Tasks automatically lock when moved to "Done" column
- **Auto-Archive**: Tasks in "Done" column are automatically archived after 24 hours
- **Manual Archive**: Archive tasks and boards manually for better organization
- **Column Reordering**: Drag columns to reorder them horizontally
- **Task Creation Restriction**: Tasks can only be created in the "To-Do" column

### 📦 Archive System
- **Archive Tab**: Dedicated page for viewing archived tasks and boards
- **Real-time Updates**: Archive changes update in real-time across all tabs
- **Restore Functionality**: Restore archived items back to active boards
- **CSV Export**: Export archived tasks and boards to CSV for backup
- **Auto-Archive**: Automatic archiving of tasks after 24 hours in "Done" column
- **Manual Archive**: Archive boards and tasks manually for organization
- **Event-Driven Updates**: Uses localStorage events and CustomEvents for cross-tab synchronization

### 🔔 Intelligent Alerts
- **Due Date Alerts**: Real-time notifications for upcoming and overdue tasks
- **Completion Alerts**: Celebrate task completions with visual feedback
- **Smart Notifications**: Contextual alerts based on task status and deadlines
- **Browser Notifications**: Native browser notifications with permission management
- **Alert Persistence**: Alerts persist across page refreshes
- **Visibility API Integration**: Optimizes alert checking when tab is hidden
- **Duplicate Prevention**: Stable alert IDs prevent duplicate notifications

### 🔒 Security & Privacy
- **User Authentication**: Secure email/password authentication with NextAuth.js
- **Multi-Factor Authentication (MFA)**: TOTP-based two-factor authentication with QR code setup
- **Password Reset**: Secure password reset flow with email tokens
- **Password Uniqueness**: Enforces unique passwords across all users
- **Data Isolation**: Each user's data is completely isolated and secure
- **Permission System**: Comprehensive permission checks for all operations
- **Secure Sessions**: JWT-based session management
- **Input Validation**: Zod schema validation on all inputs
- **Row Level Security (RLS)**: Database-level security policies for sensitive tables
- **Security Logging**: Comprehensive logging of security events

### 🎨 User Experience
- **Dark Mode**: Beautiful dark and light themes with system preference detection
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Polished UI with Framer Motion animations
- **Real-time Updates**: Optimistic UI updates for instant feedback
- **Accessibility**: ARIA labels and keyboard navigation support
- **Locale-Aware Dates**: Date picker shows format hints based on user's locale
- **Black & White Minimal Design**: Clean, minimal interface with high contrast

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router and Turbopack
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
- **otplib** - TOTP (Time-based One-Time Password) for MFA
- **qrcode** - QR code generation for MFA setup

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
   # Database Connection (Direct connection, port 5432)
   DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   
   # Optional: Shadow database URL for migrations (can be same as DATABASE_URL)
   SHADOW_DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   
   # NextAuth Configuration
   AUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   ```
   
   Generate `AUTH_SECRET`:
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
│   │   │   ├── register/         # User registration
│   │   │   ├── mfa/              # MFA setup, verify, disable
│   │   │   └── password/         # Password reset flow
│   │   ├── archive/              # Archive operations
│   │   │   ├── boards/           # Archived boards API
│   │   │   ├── tasks/            # Archived tasks API
│   │   │   └── export/           # CSV export functionality
│   │   ├── boards/               # Board CRUD operations
│   │   │   ├── [id]/             # Individual board operations
│   │   │   │   └── archive/      # Board archiving
│   │   │   ├── list/             # List all user's boards
│   │   │   └── user/             # Get user's first board
│   │   ├── columns/              # Column management
│   │   │   └── [id]/             # Column update (reordering)
│   │   ├── tasks/                # Task operations
│   │   │   ├── [id]/             # Individual task operations
│   │   │   │   └── archive/      # Task archiving
│   │   │   └── cleanup/          # Auto-archive cleanup
│   │   └── user/                 # User management
│   │       └── delete/            # Account deletion
│   ├── auth/                     # Authentication pages
│   │   ├── signin/               # Sign-in page
│   │   └── password/             # Password reset pages
│   │       └── reset/            # Password reset confirmation
│   ├── archive/                  # Archive page
│   │   └── page.tsx              # Archive management UI
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
│   ├── mfa-utils.ts              # MFA TOTP utilities
│   ├── password-utils.ts         # Password validation and uniqueness
│   ├── date-utils.ts             # Locale-aware date formatting
│   ├── archive-events.ts         # Archive event system
│   ├── security-logger.ts       # Security event logging
│   └── types.ts                  # TypeScript type definitions
├── server/                        # Server-side utilities
│   └── auth.ts                   # Auth session helper
├── prisma/                        # Database schema
│   ├── schema.prisma             # Prisma schema definition
│   ├── migrations/                # Database migrations
│   ├── RLS_NOTES.md              # Row Level Security documentation
│   └── MIGRATION_TROUBLESHOOTING.md # Migration troubleshooting guide
├── tests/                         # Test files
│   ├── auth.test.ts              # Authentication tests
│   ├── auth-security.test.ts     # Security tests
│   ├── api-tasks.test.ts         # Task API tests
│   ├── permissions.test.ts       # Permission system tests
│   ├── task-persistence.test.ts  # Task persistence tests
│   ├── column-behavior.test.ts   # Column behavior tests
│   ├── due-date-alerts.test.ts   # Alert system tests
│   ├── account-deletion.test.ts  # Account deletion tests
│   ├── password-uniqueness.test.ts # Password uniqueness tests
│   ├── archive-realtime.test.ts # Archive real-time update tests
│   └── setup.ts                  # Test setup configuration
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
2. **MFA (Optional)**: User can enable TOTP-based MFA for additional security
3. **Board Selection**: User selects a board → Board data fetched from API
4. **Task Management**: User creates/edits/moves tasks → Optimistic UI updates → Database persistence
5. **Alerts**: System checks due dates → Alerts generated → Browser notifications shown
6. **Auto-Archive**: Background process archives tasks in Done column after 24 hours
7. **Archive Management**: Users can manually archive/restore tasks and boards

### State Management

- **Server State**: Managed via API routes and Prisma
- **Client State**: React hooks (`useState`, `useCallback`, `useMemo`)
- **Global State**: React Context API (alerts, layout, theme)
- **Persistence**: localStorage for board selection, database for all data
- **Real-time Updates**: localStorage events and CustomEvents for cross-tab communication

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

### 2. Task Locking and Auto-Archive System

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
- Displays countdown timer until archive

#### Auto-Archive Algorithm

**Location**: `app/api/tasks/cleanup/route.ts`

**Process**:

1. **Calculate Cutoff Time**:
   ```typescript
   const twentyFourHoursAgo = new Date();
   twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
   ```

2. **Find Tasks to Archive**:
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
           archived: false, // Only archive tasks that aren't already archived
         },
       },
     },
   });
   ```

3. **Batch Archive**:
   ```typescript
   await db.task.updateMany({
     where: { id: { in: taskIdsToArchive } },
     data: {
       archived: true,
       archivedAt: new Date(),
     },
   });
   ```

**Client-Side Countdown**:
- Location: `components/kanban-task.tsx`
- Updates every minute showing time until archive
- Format: "Xh Ym" or "Ym" if less than 1 hour
- Archived tasks are hidden from the main board view but can be restored

### 3. Archive System with Real-time Updates

**Location**: `app/archive/page.tsx`, `lib/archive-events.ts`

#### Archive Event System

The archive system uses a multi-pronged approach for real-time updates:

1. **localStorage Events** (Cross-tab communication):
   ```typescript
   // Emit event
   localStorage.setItem('kibble:archive:update', JSON.stringify({ type, timestamp }));
   
   // Listen for events
   window.addEventListener('storage', (e) => {
     if (e.key === 'kibble:archive:update') {
       // Refresh archive data
     }
   });
   ```

2. **CustomEvents** (Same-tab communication):
   ```typescript
   // Emit event
   window.dispatchEvent(new CustomEvent('kibble:archive:updated', { detail: { type } }));
   
   // Listen for events
   window.addEventListener('kibble:archive:updated', handleArchiveUpdate);
   ```

3. **Polling with Visibility API**:
   ```typescript
   useEffect(() => {
     const interval = setInterval(() => {
       if (!document.hidden) {
         fetchArchivedItems();
       }
     }, 30000); // Poll every 30 seconds when tab is visible
     
     // Also listen for visibility changes
     document.addEventListener('visibilitychange', handleVisibilityChange);
   }, []);
   ```

**Benefits**:
- Updates work across multiple browser tabs
- Efficient polling only when tab is visible
- Immediate updates via events
- Manual refresh button for user control

### 4. Multi-Factor Authentication (MFA)

**Location**: `lib/mfa-utils.ts`, `app/api/auth/mfa/`

#### TOTP Setup Flow

1. **Generate Secret**:
   ```typescript
   const secret = authenticator.generateSecret();
   const otpAuthUrl = authenticator.keyuri(email, 'Kibble', secret);
   ```

2. **Generate QR Code**:
   ```typescript
   const qrCode = await QRCode.toDataURL(otpAuthUrl);
   ```

3. **Store Backup Codes**:
   ```typescript
   const backupCodes = generateBackupCodes();
   const hashedCodes = await hashBackupCodes(backupCodes);
   await db.user.update({
     where: { id: userId },
     data: { mfaSecret: secret, mfaBackupCodes: hashedCodes },
   });
   ```

#### TOTP Verification

```typescript
function verifyTOTP(token: string, secret: string): boolean {
  return authenticator.check(token, secret);
}
```

#### Backup Code Verification

```typescript
async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.mfaBackupCodes) return false;
  
  const codes = JSON.parse(user.mfaBackupCodes);
  for (const hashedCode of codes) {
    if (await bcrypt.compare(code, hashedCode)) {
      // Remove used backup code
      await removeBackupCode(userId, code);
      return true;
    }
  }
  return false;
}
```

### 5. Password Uniqueness System

**Location**: `lib/password-utils.ts`

#### Uniqueness Check Algorithm

```typescript
export async function isPasswordUnique(
  password: string,
  excludeUserId?: string
): Promise<boolean> {
  const users = await db.user.findMany({
    where: excludeUserId ? { id: { not: excludeUserId } } : {},
    select: { id: true, password: true },
  });
  
  // Early exit optimization
  for (const user of users) {
    const matches = await bcrypt.compare(password, user.password);
    if (matches) return false;
  }
  
  return true;
}
```

**Security Considerations**:
- Uses `bcrypt.compare` to check against all stored hashes
- Computationally expensive but necessary for security
- Early exit when match is found
- Excludes current user during password reset

### 6. Order Recalculation Algorithm

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

### 7. Optimistic UI Updates

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

### 8. Alert System Architecture

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
- Prevents notifications on auth pages to avoid duplicate tabs

### 9. Locale-Aware Date Formatting

**Location**: `lib/date-utils.ts`

#### Date Format Detection

```typescript
function getLocaleDateFormat(): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(new Date(2024, 0, 15));
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  // Determine if locale uses DD/MM or MM/DD
  return day === '15' ? 'DD/MM/YYYY' : 'MM/DD/YYYY';
}
```

**Usage in UI**:
- Shows format hint: "Format: DD/MM/YYYY HH:MM" or "Format: MM/DD/YYYY HH:MM"
- Provides tooltip on date input
- Helps users understand expected format

### 10. Permission System

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

### 11. Prisma Client Singleton Pattern

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

### 12. Column Width Calculation

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

### 13. View Mode System

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

### 14. Task Creation Restriction

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

### 15. Auto-Cleanup Scheduling

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
3. Archives tasks in Done column older than 24 hours
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
- Enforces password uniqueness across all users
- Hashes password with bcrypt
- Returns generic error messages (security)

#### `GET/POST /api/auth/[...nextauth]`
- NextAuth.js handlers
- JWT session management
- Credentials provider

#### `POST /api/auth/mfa/setup`
- Generates TOTP secret and QR code
- Creates backup codes
- Stores secret and hashed backup codes

#### `POST /api/auth/mfa/verify`
- Verifies TOTP token during setup
- Enables MFA if verification succeeds

#### `POST /api/auth/mfa/login`
- Verifies TOTP token or backup code during login
- Required if user has MFA enabled

#### `POST /api/auth/mfa/disable`
- Disables MFA for user
- Requires password confirmation

#### `GET /api/auth/mfa/status`
- Returns MFA status for current user

#### `POST /api/auth/password/reset/request`
- Initiates password reset flow
- Generates secure reset token
- Stores hashed token with expiration

#### `POST /api/auth/password/reset/confirm`
- Confirms password reset with token
- Validates token and expiration
- Enforces password uniqueness
- Updates password and invalidates token

### Archive Routes

#### `GET /api/archive/tasks`
- Returns all archived tasks for authenticated user
- Includes task details and archive timestamp

#### `GET /api/archive/boards`
- Returns all archived boards for authenticated user
- Includes board details and archive timestamp

#### `POST /api/archive/export`
- Exports archived tasks and/or boards to CSV
- Returns CSV file for download

### Board Routes

#### `GET /api/boards/list`
- Returns all user's boards (active and archived)
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

#### `POST /api/boards/[id]/archive`
- Archives board
- Sets `archived = true` and `archivedAt = timestamp`
- Permission check required

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

#### `POST /api/tasks/[id]/archive`
- Archives task manually
- Sets `archived = true` and `archivedAt = timestamp`
- Permission check required

#### `POST /api/tasks/cleanup`
- Archives tasks in Done column older than 24 hours
- Batch archive for efficiency
- Returns count of archived tasks

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
- `mfaSecret`: Encrypted TOTP secret (optional)
- `mfaBackupCodes`: JSON array of hashed backup codes (optional)
- Relations: `boards`, `accounts`, `sessions`, `passwordResetTokens`
- Indexes: `email` (unique)

#### Board
- `id`: Unique identifier
- `title`: Board name
- `userId`: Owner reference
- `archived`: Boolean flag indicating if board is archived
- `archivedAt`: Timestamp when board was archived
- Relations: `columns`, `user`
- Indexes: `userId`, `archived`, `archivedAt`

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
- `movedToDoneAt`: Timestamp when moved to Done (for auto-archive)
- `archived`: Boolean flag indicating if task is archived
- `archivedAt`: Timestamp when task was archived
- Relations: `column`
- Indexes: `columnId`, `dueDate`, `movedToDoneAt`, `locked`, `archived`, `archivedAt`

#### PasswordResetToken
- `id`: Unique identifier
- `userId`: User reference
- `token`: Hashed reset token
- `expiresAt`: Token expiration timestamp
- Relations: `user`
- Indexes: `userId`, `expiresAt`
- **RLS Enabled**: Row Level Security policies ensure users can only access their own tokens

#### Account
- `id`: Unique identifier
- `userId`: User reference
- `type`: Account type
- `provider`: OAuth provider (for future OAuth support)
- `providerAccountId`: Provider account ID
- Relations: `user`
- Indexes: `userId`, `provider` + `providerAccountId` (unique)

#### Session
- `id`: Unique identifier
- `userId`: User reference
- `sessionToken`: Unique session token
- `expires`: Session expiration timestamp
- Relations: `user`
- Indexes: `userId`, `sessionToken` (unique)

### Relationships

```
User → Board (1:many)
User → PasswordResetToken (1:many)
User → Account (1:many)
User → Session (1:many)
Board → Column (1:many)
Column → Task (1:many)
```

All relationships use `onDelete: Cascade` for automatic cleanup.

### Row Level Security (RLS)

**Location**: `prisma/RLS_NOTES.md`

RLS is enabled for the `PasswordResetToken` table in Supabase:

- **SELECT Policy**: Users can only view their own password reset tokens
- **INSERT Policy**: Users can only create tokens for themselves
- **UPDATE Policy**: Users can only update their own tokens
- **DELETE Policy**: Users can only delete their own tokens

**Note**: The `_prisma_migrations` table does not have RLS enabled as it's a system table.

## 🔒 Security

### Authentication
- **NextAuth.js v5**: Industry-standard authentication
- **bcryptjs**: Password hashing (secure, slow hashing)
- **JWT Sessions**: Stateless session management
- **MFA (TOTP)**: Time-based One-Time Password for two-factor authentication
- **Backup Codes**: Secure backup codes for MFA recovery

### Authorization
- **Permission System**: All API routes check permissions
- **Resource Ownership**: Users can only access their own data
- **Horizontal Access Control**: Prevents IDOR (Insecure Direct Object Reference)
- **Server-Side Only**: All permission checks happen server-side
- **Row Level Security**: Database-level security policies

### Password Security
- **Password Uniqueness**: Enforces unique passwords across all users
- **Password Strength**: Minimum 8 characters required
- **Secure Hashing**: bcrypt with appropriate salt rounds
- **Password Reset**: Secure token-based reset flow with expiration

### Input Validation
- **Zod Schemas**: Type-safe validation
- **String Sanitization**: Trims whitespace, validates types
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: React's built-in XSS protection

### Error Handling
- **Generic Messages**: No sensitive data in error responses
- **Development vs Production**: Detailed errors only in development
- **Fail Securely**: Default to denying access

### Security Logging
- **Security Events**: Comprehensive logging of security events
- **IP Tracking**: Client IP address logging
- **User Agent Tracking**: Browser/user agent logging
- **Event Types**: Login attempts, password resets, MFA setup, etc.

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
- `DATABASE_URL`: PostgreSQL connection string (direct connection, port 5432)
- `SHADOW_DATABASE_URL`: Optional shadow database URL for migrations
- `AUTH_SECRET`: Generated secret (32+ characters) - Required for NextAuth v5
- `NEXTAUTH_URL`: Production URL

**Database Setup**:
1. Use Supabase or any PostgreSQL provider
2. Get direct connection string (port 5432, not pooler)
3. Set as `DATABASE_URL` in Vercel
4. Run migrations: `npx prisma migrate deploy`

**Important**: Use direct connection (port 5432) for migrations, not the pooler (port 6543).

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
- `password-uniqueness.test.ts` - Password uniqueness tests
- `archive-realtime.test.ts` - Archive real-time update tests

## 📚 Key Design Decisions

### Why Optimistic UI Updates?

- **User Experience**: Instant feedback feels more responsive
- **Perceived Performance**: Users see changes immediately
- **Error Handling**: Automatic rollback via refetch on error

### Why Task Locking?

- **Workflow Enforcement**: Prevents editing completed tasks
- **Data Integrity**: Ensures Done tasks remain unchanged
- **Auto-Archive**: Enables automatic archiving after 24 hours (tasks are hidden but can be restored)

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

### Why Archive Instead of Delete?

- **Data Preservation**: Users can restore archived items
- **History**: Maintains complete task and board history
- **Export**: Enables CSV export for backup
- **Recovery**: Prevents accidental data loss

### Why Real-time Archive Updates?

- **User Experience**: Immediate feedback across all tabs
- **Consistency**: Ensures all tabs show the same data
- **Efficiency**: Combines polling, events, and Visibility API

## 🐛 Troubleshooting

### Database Connection Issues

**Error**: "Can't reach database server"
- Verify `DATABASE_URL` is correct
- Check database firewall allows connections
- Ensure password is correctly set
- Use direct connection (port 5432) for migrations

**Error**: "Too many connections"
- Verify Prisma singleton is working
- Check database connection limits
- Review connection pooling configuration

**Error**: "P3006 schema auth does not exist"
- This is expected in shadow databases
- RLS migrations are conditional and skip if `auth` schema doesn't exist
- See `prisma/MIGRATION_TROUBLESHOOTING.md` for details

### Build Issues

**Error**: "Prisma Client not generated"
- Run `npm run db:generate` manually
- Check `postinstall` script in package.json
- Verify Prisma schema is valid

**Error**: "Turbopack with webpack config"
- Remove any `webpack` configuration from `next.config.js`
- Use Turbopack configuration instead

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
- Ensure not on auth pages (notifications disabled there)

### Archive Issues

**Issue**: Archive not updating in real-time
- Check browser console for errors
- Verify localStorage events are working
- Check if tab is visible (polling only when visible)
- Try manual refresh button

### MFA Issues

**Issue**: MFA setup fails
- Verify QR code is scanned correctly
- Check TOTP code format (6 digits)
- Ensure system clock is synchronized
- Try backup codes if TOTP fails

## 📖 Additional Resources

- **[REFERENCES.md](./REFERENCES.md)** - Official documentation links for all technologies
- **[prisma/RLS_NOTES.md](./prisma/RLS_NOTES.md)** - Row Level Security documentation
- **[prisma/MIGRATION_TROUBLESHOOTING.md](./prisma/MIGRATION_TROUBLESHOOTING.md)** - Migration troubleshooting guide

## 📝 License

ISC

---

**Made with ❤️ for students who want to stay organized**
