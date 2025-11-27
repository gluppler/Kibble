# 🎓 Kibble

A modern, full-stack task management application designed to help students and professionals organize their work with class-based boards, intelligent alerts, and a beautiful Kanban interface. Built with Next.js 16, React 19, and TypeScript for maximum performance and type safety.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)
![Vitest](https://img.shields.io/badge/Vitest-4.0-6E9F18?style=flat-square&logo=vitest)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Core Architecture](#-core-architecture)
- [Recent Improvements](#-recent-improvements)
- [API Routes](#-api-routes)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### 📚 Class-Based Task Management
- **Multiple Boards**: Create separate boards for different classes, subjects, or projects
- **Organized Structure**: Each board contains its own columns and tasks with complete isolation
- **Easy Navigation**: Quick access to all boards via responsive sidebar
- **Board CRUD**: Create, edit, archive, and delete boards with confirmation dialogs
- **Board Archiving**: Archive boards to preserve history without permanent deletion
- **Real-time Updates**: Archive changes sync across tabs and sessions instantly
- **Persistent Selection**: Board selection persists across page refreshes using localStorage

### 📋 Kanban Board & Multiple Views
- **Drag & Drop**: Intuitive drag-and-drop interface for tasks and columns with mobile touch support
- **Multiple Views**: Switch seamlessly between Kanban, Table, Grid, and List views
- **Task Organization**: Organize tasks across customizable columns (To-Do, In-Progress, Review, Done)
- **Task Locking**: Tasks automatically lock when moved to "Done" column to preserve completion state
- **Auto-Archive**: Tasks in "Done" column are automatically archived after 24 hours
- **Manual Archive**: Archive tasks and boards manually for better organization
- **Column Reordering**: Drag columns to reorder them horizontally
- **Task Creation Restriction**: Tasks can only be created in the "To-Do" column to enforce workflow
- **Responsive Column Wrapping**: Columns automatically wrap vertically on mobile and when window is resized
- **Optimistic UI Updates**: Instant feedback with no page refreshes during drag-and-drop operations

### 📦 Archive System
- **Archive Tab**: Dedicated page for viewing archived tasks and boards (visible on mobile)
- **Real-time Updates**: Archive changes update in real-time across all tabs using localStorage events
- **Restore Functionality**: Restore archived items back to active boards with one click
- **CSV Export**: Export archived tasks and boards to CSV for backup and analysis
- **Auto-Archive**: Automatic archiving of tasks after 24 hours in "Done" column
- **Manual Archive**: Archive boards and tasks manually for organization
- **Event-Driven Updates**: Uses localStorage events and CustomEvents for cross-tab synchronization
- **Polling with Visibility API**: Efficient background updates only when tab is visible

### 🔔 Intelligent Alerts
- **Due Date Alerts**: Real-time notifications for upcoming and overdue tasks
- **Completion Alerts**: Celebrate task completions with visual feedback
- **Smart Notifications**: Contextual alerts based on task status and deadlines
- **Browser Notifications**: Native browser notifications with permission management
- **Alert Persistence**: Alerts persist across page refreshes
- **Visibility API Integration**: Optimizes alert checking when tab is hidden
- **Duplicate Prevention**: Stable alert IDs prevent duplicate notifications
- **Alert Validation**: Robust validation prevents errors from invalid alert data

### 🔒 Security & Privacy
- **User Authentication**: Secure email/password authentication with NextAuth.js v5
- **Multi-Factor Authentication (MFA)**: TOTP-based two-factor authentication with QR code setup
- **Password Reset**: Secure MFA-based password reset flow with recovery codes
- **Password Uniqueness**: Enforces unique passwords across all users for enhanced security
- **Data Isolation**: Each user's data is completely isolated and secure
- **Permission System**: Comprehensive permission checks for all operations
- **Secure Sessions**: JWT-based session management
- **Input Validation**: Zod schema validation on all inputs
- **Row Level Security (RLS)**: Database-level security policies for sensitive tables
- **Security Logging**: Comprehensive logging of security events
- **Rate Limiting**: Protection against brute-force attacks

### 🎨 User Experience
- **Dark Mode**: Beautiful dark and light themes with system preference detection
- **Responsive Design**: Fully responsive design that works seamlessly on desktop, tablet, and mobile
- **Mobile-First**: Optimized for mobile with proper touch targets and responsive column wrapping
- **Smooth Animations**: Polished UI with Framer Motion animations
- **Real-time Updates**: Optimistic UI updates for instant feedback without page refreshes
- **Accessibility**: ARIA labels, keyboard navigation support, and proper semantic HTML
- **Locale-Aware Dates**: Date picker shows format hints based on user's locale
- **Black & White Minimal Design**: Clean, minimal interface with high contrast
- **PWA Support**: Progressive Web App with service worker and install prompt
- **Navigation Fixes**: Robust board loading when navigating between pages

### 🚀 Performance Optimizations
- **Memoized Components**: React.memo for frequently rendered components (KanbanTask, KanbanColumn)
- **Optimized Re-renders**: useCallback and useMemo for expensive computations
- **Code Deduplication**: Shared utilities for date formatting and common operations
- **Centralized Logging**: Development-only logging with no production information leakage
- **Bundle Optimization**: Removed duplicate code and unused imports
- **Efficient State Management**: Optimistic updates reduce unnecessary API calls

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router and Turbopack
- **React 19** - UI library with modern hooks
- **TypeScript 5.9** - Full type safety
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion 12** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints optimized for Vercel
- **NextAuth.js v5** - Authentication and session management
- **Prisma 6.19** - Next-generation ORM with type safety
- **PostgreSQL** - Robust relational database
- **bcryptjs** - Secure password hashing
- **Zod 4.1** - Runtime schema validation
- **otplib** - TOTP (Time-based One-Time Password) for MFA
- **qrcode** - QR code generation for MFA setup

### Drag & Drop
- **@dnd-kit/core** - Modern drag and drop library
- **@dnd-kit/sortable** - Sortable components for lists
- **@dnd-kit/utilities** - Utility functions for drag operations
- **Mobile Touch Support**: Optimized touch sensors for mobile devices

### Development Tools
- **Vitest 4.0** - Fast unit testing framework
- **@testing-library/react** - React component testing
- **ESLint** - Code linting with Next.js rules
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (or 22+ recommended)
- **PostgreSQL** database (local or hosted on Supabase/other providers)
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
│   │   │   ├── mfa/              # MFA setup, verify, disable, login
│   │   │   ├── check-mfa/        # MFA status check
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
│   │   │   ├── alerts/           # Task alerts API
│   │   │   └── cleanup/          # Auto-archive cleanup
│   │   └── user/                 # User management
│   │       └── delete/           # Account deletion
│   ├── auth/                     # Authentication pages
│   │   ├── signin/               # Sign-in page
│   │   └── password/              # Password reset pages
│   │       └── reset/             # Password reset confirmation
│   ├── archive/                   # Archive page
│   │   └── page.tsx               # Archive management UI
│   ├── settings/                  # Settings page
│   ├── layout.tsx                  # Root layout with providers
│   ├── page.tsx                    # Main dashboard
│   ├── providers.tsx               # Context providers wrapper
│   ├── register-sw.tsx            # Service worker registration
│   └── globals.css                 # Global styles with responsive utilities
├── components/                     # React components
│   ├── kanban-board.tsx           # Main Kanban board component
│   ├── kanban-column.tsx          # Column component (memoized)
│   ├── kanban-task.tsx            # Task card component (memoized)
│   ├── board-table-view.tsx       # Table view implementation
│   ├── board-grid-view.tsx        # Grid view implementation
│   ├── board-list-view.tsx        # List view implementation
│   ├── layout-selector.tsx        # View mode selector
│   ├── sidebar.tsx                # Navigation sidebar
│   ├── notification-system.tsx    # Alert notification panel
│   ├── create-board-dialog.tsx    # Board creation dialog
│   ├── edit-board-dialog.tsx      # Board editing dialog
│   ├── edit-task-dialog.tsx       # Task editing dialog
│   ├── delete-confirmation-dialog.tsx # Confirmation dialogs
│   ├── pwa-install-prompt.tsx     # PWA install prompt
│   └── orientation-handler.tsx    # Device orientation handler
├── contexts/                       # React contexts
│   ├── alert-context.tsx          # Alert management context
│   ├── layout-context.tsx         # Layout preferences context
│   └── theme-context.tsx          # Theme management context
├── lib/                            # Utilities and helpers
│   ├── db.ts                      # Prisma client (singleton pattern)
│   ├── auth.ts                    # NextAuth configuration
│   ├── permissions.ts             # Permission checking utilities
│   ├── alert-utils.ts             # Alert calculation and formatting
│   ├── date-formatters.ts         # Shared date formatting utilities
│   ├── date-utils.ts              # Locale-aware date utilities
│   ├── mfa-utils.ts               # MFA TOTP utilities
│   ├── password-utils.ts          # Password validation and uniqueness
│   ├── archive-events.ts          # Archive event system
│   ├── security-logger.ts        # Security event logging
│   ├── rate-limit.ts              # Rate limiting utilities
│   ├── logger.ts                  # Centralized logging (dev only)
│   └── types.ts                   # TypeScript type definitions
├── server/                         # Server-side utilities
│   └── auth.ts                    # Auth session helper
├── prisma/                         # Database schema
│   ├── schema.prisma              # Prisma schema definition
│   ├── migrations/                # Database migrations
│   ├── RLS_NOTES.md               # Row Level Security documentation
│   └── MIGRATION_TROUBLESHOOTING.md # Migration troubleshooting guide
├── tests/                          # Test files
│   ├── auth.test.ts               # Authentication tests
│   ├── auth-security.test.ts      # Security tests
│   ├── api-tasks.test.ts          # Task API tests
│   ├── permissions.test.ts        # Permission system tests
│   ├── task-persistence.test.ts   # Task persistence tests
│   ├── column-behavior.test.ts     # Column behavior tests
│   ├── due-date-alerts.test.ts    # Alert system tests
│   ├── account-deletion.test.ts   # Account deletion tests
│   ├── password-uniqueness.test.ts # Password uniqueness tests
│   ├── password-reset-mfa.test.ts # MFA password reset tests
│   ├── archive-realtime.test.ts   # Archive real-time update tests
│   ├── board-navigation.test.ts   # Board loading navigation tests
│   └── setup.ts                   # Test setup configuration
├── public/                         # Static assets
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   └── icon.svg                   # App icon
├── types/                          # Type definitions
│   └── next-auth.d.ts             # NextAuth type extensions
├── scripts/                        # Utility scripts
│   └── test-db-connection.ts      # Database connection test
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── vitest.config.ts                # Vitest test configuration
├── vercel.json                     # Vercel deployment configuration
└── package.json                    # Dependencies and scripts
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

## 🆕 Recent Improvements

### Navigation & Board Loading Fixes
- **Fixed Board Loading**: Boards now load correctly when navigating back from Archive, Settings, or after Sign Out
- **Pathname Detection**: Added `usePathname()` to detect navigation to main page
- **State Reset**: Automatically resets loading state when returning to main page
- **Board Creation**: Ensures boards are loaded before creating new boards after navigation

### Performance Optimizations
- **Component Memoization**: Added `React.memo` to `KanbanTask` and `KanbanColumn` components
- **Code Deduplication**: Removed duplicate date formatting functions, using shared utilities
- **Unused Import Removal**: Cleaned up unused imports (e.g., `Clock` from grid view)
- **Optimistic Updates**: Eliminated unnecessary page refreshes during drag-and-drop operations

### Mobile UI/UX Enhancements
- **Responsive Column Wrapping**: Columns wrap vertically on mobile instead of horizontal scroll
- **Archive Tab Visibility**: Archive tab is now visible in mobile sidebar
- **Touch Optimization**: Improved drag-and-drop touch handling for mobile devices
- **Column Scaling**: Columns properly scale and wrap when window is resized

### Code Quality
- **Centralized Logging**: All `console.error/warn/log` replaced with `logError/logWarn/logInfo` from `@/lib/logger`
- **Development-Only Logging**: Logging only occurs in development mode to prevent information leakage
- **Type Safety**: Centralized type definitions in `lib/types.ts` to avoid duplication
- **Error Handling**: Robust validation and error handling throughout the codebase

### Testing
- **Fixed Failing Tests**: Updated password reset MFA tests to test logic directly instead of HTTP calls
- **New Test Coverage**: Added `board-navigation.test.ts` for navigation scenarios
- **All Tests Passing**: 175 tests passing, 5 skipped (180 total)

## 🧠 Complex Logic Documentation

### 1. Drag and Drop Algorithm

**Location**: `components/kanban-board.tsx` - `handleDragEnd` function

The drag-and-drop system handles both task and column reordering with complex order recalculation and optimistic UI updates.

#### Task Dragging Logic

**Algorithm Steps**:

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
   - **No page refresh** - uses functional state updates

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

**Complexity**: O(n) where n is the number of tasks in affected columns

#### Column Reordering Logic

**Algorithm Steps**:

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
           archived: false,
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

This handles order updates when tasks are moved between columns or reordered within the same column.

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

**Complexity**: O(n) database operations where n is number of affected tasks

### 7. Optimistic UI Updates

**Location**: `components/kanban-board.tsx` - `handleDragEnd` function

**Pattern**: Update UI immediately, then sync with server

**Implementation**:

```typescript
// 1. Update local state immediately (no page refresh)
setBoard((prevBoard) => {
  if (!prevBoard || !updatedTask) return prevBoard;
  // Create updated board with task moved
  return syncedBoard;
});

// 2. Persist to database
const response = await fetch(`/api/tasks/${taskId}`, {
  method: "PATCH",
  body: JSON.stringify({ columnId: newColumnId, order: newOrder }),
});

// 3. On error, refetch to restore correct state
if (!response.ok) {
  await fetchBoard();
}
```

**Benefits**:
- Instant user feedback
- Perceived performance improvement
- Automatic rollback on error (via refetch)
- No page refreshes during drag-and-drop

### 8. Alert System Architecture

**Location**: `lib/alert-utils.ts`, `contexts/alert-context.tsx`, `components/notification-system.tsx`

#### Alert Generation

**Due Date Alert Logic**:

```typescript
function checkTaskAlert(task: Task): Alert | null {
  if (!task.dueDate) return null;
  
  const daysUntil = calculateDaysUntil(dueDate);
  
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
  if (!window.isSecureContext) return 'denied';
  if (!('Notification' in window)) return 'denied';
  
  return await Notification.requestPermission();
}
```

**Notification Tagging**:
- Uses stable tags to prevent duplicate browser notifications
- Same tag = browser replaces existing notification
- Tracks sent notifications to prevent duplicates
- Prevents notifications on auth pages

### 9. Responsive Column Wrapping

**Location**: `app/globals.css` - `.kanban-columns-container` and `.kanban-column-wrapper`

#### Mobile-First Approach

**Mobile (< 640px)**:
- 2 columns per row
- Vertical wrapping when space is tight
- No horizontal scroll

**Desktop (≥ 1024px)**:
- Flexible column sizing based on available space
- Wraps when columns don't fit (even with 10% overflow)
- Uses `flex: 1 1` with `min-width` to force wrapping

**Implementation**:
```css
.kanban-columns-container {
  display: flex;
  flex-wrap: wrap;
  overflow-x: hidden;
  gap: clamp(0.5rem, 1.5vw, 1rem);
}

.kanban-column-wrapper {
  /* Mobile: 2 columns per row */
  width: calc(50% - clamp(0.25rem, 0.75vw, 0.5rem)) !important;
  
  /* Desktop: flexible with wrapping */
  @media (min-width: 1024px) {
    flex: 1 1 calc((100% - (3 * gap)) / 4) !important;
    min-width: 200px !important;
  }
}
```

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
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = db;
  }
}
```

**Benefits**:
- Prevents connection exhaustion
- Reuses connections across serverless invocations
- Works in both development and production

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

#### `POST /api/auth/check-mfa`
- Checks if user has MFA enabled after password verification

#### `POST /api/auth/password/reset/request`
- Initiates MFA-based password reset flow
- Returns MFA status and recovery code availability
- Generic response to prevent email enumeration

#### `POST /api/auth/password/reset/confirm`
- Confirms password reset with TOTP or recovery code
- Validates code and enforces password uniqueness
- Updates password and invalidates all sessions

### Archive Routes

#### `GET /api/archive/tasks`
- Returns all archived tasks for authenticated user
- Includes task details and archive timestamp
- Ordered by archive date (newest first)

#### `GET /api/archive/boards`
- Returns all archived boards for authenticated user
- Includes board details and archive timestamp
- Ordered by archive date (newest first)

#### `GET /api/archive/export`
- Exports archived tasks and/or boards to CSV
- Returns CSV file for download
- Includes all task/board metadata

### Board Routes

#### `GET /api/boards/list`
- Returns all user's active boards
- Filters by `userId` and `archived: false`
- Ordered by creation date (newest first)

#### `POST /api/boards`
- Creates new board with default columns
- Default columns: To-Do, In-Progress, Review, Done
- Returns created board in consistent format

#### `GET /api/boards/[id]`
- Fetches board with all columns and tasks
- Permission check: user must own the board
- Includes nested relations (columns → tasks)
- Excludes archived tasks from main view

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

#### `DELETE /api/boards/[id]/archive`
- Unarchives (restores) board
- Sets `archived = false` and `archivedAt = null`
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
- Handles optional description and dueDate

#### `PATCH /api/tasks/[id]`
- Updates task (title, description, dueDate, columnId, order)
- **Complex Logic**: Order recalculation (see above)
- **Task Locking**: Auto-locks when moved to Done
- **Verification**: Double-checks update persisted

#### `DELETE /api/tasks/[id]`
- Deletes task permanently
- Permission check required
- Cascade updates order in column

#### `POST /api/tasks/[id]/archive`
- Archives task manually
- Sets `archived = true` and `archivedAt = timestamp`
- Permission check required

#### `DELETE /api/tasks/[id]/archive`
- Unarchives (restores) task
- Sets `archived = false` and `archivedAt = null`
- Permission check required

#### `POST /api/tasks/cleanup`
- Archives tasks in Done column older than 24 hours
- Batch archive for efficiency
- Returns count of archived tasks

#### `GET /api/tasks/cleanup`
- Returns tasks approaching 24-hour mark
- Used for preview/notification purposes
- Shows time until archive

#### `GET /api/tasks/alerts`
- Returns tasks with due dates that need alerts
- Used by notification system
- Filters by user's boards

### Column Routes

#### `POST /api/columns`
- Creates new column
- Calculates order (max order + 1)
- Validates title and boardId

#### `PATCH /api/columns/[id]`
- Updates column order
- **Complex Logic**: Shifts other columns' orders
- Used for column reordering via drag-and-drop

### User Routes

#### `DELETE /api/user/delete`
- Deletes user account and all associated data
- Requires password re-authentication
- Cascade deletes: boards → columns → tasks
- Invalidates all sessions

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
- **Password Reset**: Secure MFA-based reset flow with expiration

### Input Validation
- **Zod Schemas**: Type-safe validation
- **String Sanitization**: Trims whitespace, validates types
- **SQL Injection Protection**: Prisma ORM prevents SQL injection
- **XSS Protection**: React's built-in XSS protection

### Error Handling
- **Generic Messages**: No sensitive data in error responses
- **Development vs Production**: Detailed errors only in development
- **Fail Securely**: Default to denying access
- **Centralized Logging**: Development-only logging prevents information leakage

### Security Logging
- **Security Events**: Comprehensive logging of security events
- **IP Tracking**: Client IP address logging
- **User Agent Tracking**: Browser/user agent logging
- **Event Types**: Login attempts, password resets, MFA setup, permission denials, etc.

## 🧪 Testing

### Test Suite

Kibble includes a comprehensive test suite with **180 test cases** (175 passing, 5 skipped):

- **Authentication Tests** (`auth.test.ts`): 17 tests
- **Security Tests** (`auth-security.test.ts`): 19 tests (5 skipped)
- **Task API Tests** (`api-tasks.test.ts`): 16 tests
- **Permission Tests** (`permissions.test.ts`): 22 tests
- **Task Persistence Tests** (`task-persistence.test.ts`): 19 tests
- **Column Behavior Tests** (`column-behavior.test.ts`): 11 tests
- **Due Date Alerts Tests** (`due-date-alerts.test.ts`): 22 tests
- **Account Deletion Tests** (`account-deletion.test.ts`): 21 tests
- **Password Uniqueness Tests** (`password-uniqueness.test.ts`): 8 tests
- **Password Reset MFA Tests** (`password-reset-mfa.test.ts`): 9 tests
- **Archive Real-time Tests** (`archive-realtime.test.ts`): 6 tests
- **Board Navigation Tests** (`board-navigation.test.ts`): 10 tests (new)

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Configuration

- **Framework**: Vitest 4.0
- **Environment**: jsdom (browser simulation)
- **Setup**: `tests/setup.ts` (mocks Next.js router, NextAuth, etc.)
- **Coverage**: v8 provider with HTML, JSON, and text reports

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
2. **Next.js Build**: Compiles application with Turbopack
3. **Optimization**: Tree-shaking, code splitting, image optimization

## 🛠️ Development

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
- **Logging**: Centralized logger (development only)

### Best Practices

- **Component Memoization**: Use `React.memo` for frequently rendered components
- **Callback Optimization**: Use `useCallback` for event handlers
- **Memoization**: Use `useMemo` for expensive computations
- **Error Handling**: Always use centralized logger, never `console.error` in production
- **Type Safety**: Centralize type definitions to avoid duplication

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

### Navigation Issues

**Issue**: Boards not loading after navigation
- Fixed in latest version with pathname detection
- Ensure `usePathname()` is imported from `next/navigation`
- Check that `hasLoadedBoards` ref is reset when boards array is empty

**Issue**: Board creation fails after navigation
- Fixed in latest version - ensures boards are loaded first
- Check that `handleCreateBoard` calls `loadBoards()` if needed

### Drag and Drop Issues

**Issue**: Tasks not moving correctly
- Check browser console for errors
- Verify API route is responding
- Check network tab for failed requests
- Ensure touch sensors are configured for mobile

**Issue**: Drag not working on mobile
- Verify `TouchSensor` is configured with proper delay
- Check `touchAction` CSS property is set correctly
- Ensure columns are properly sized for mobile

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

**Made with ❤️ for students and professionals who want to stay organized**
