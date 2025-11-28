# 🎓 Kibble

**Kibble** is a modern, production-ready task management application designed for students and professionals. Built with Next.js 16, React 19, and TypeScript, Kibble provides a comprehensive solution for organizing work with class-based boards, intelligent alerts, priority tagging, and a beautiful Kanban interface.

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
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

### 📚 Class-Based Task Management

- **Multiple Boards**: Create separate boards for different classes, subjects, or projects
- **Complete Isolation**: Each board contains its own columns and tasks with full data isolation
- **Responsive Navigation**: Quick access to all boards via responsive sidebar with mobile support
- **Board Operations**: Create, edit, archive, and delete boards with confirmation dialogs
- **Archive System**: Archive boards to preserve history without permanent deletion
- **Board Archive Includes Tasks**: When a board is archived, all its tasks are automatically archived
- **Real-time Synchronization**: Archive changes sync across tabs and sessions instantly
- **Persistent Selection**: Board selection persists across page refreshes using localStorage
- **Board Search**: Real-time search functionality in sidebar to quickly find boards

### 📋 Kanban Board & Multiple Views

- **Drag & Drop**: Intuitive drag-and-drop interface for tasks and columns with full mobile touch support
- **Multiple View Modes**: Switch seamlessly between Kanban, Table, Grid, and List views
- **Workflow Organization**: Organize tasks across customizable columns (To-Do, In-Progress, Review, Done)
- **Task Locking**: Tasks automatically lock when moved to "Done" column to preserve completion state
- **Auto-Archive**: Tasks in "Done" column are automatically archived after 24 hours
- **Manual Archive**: Archive tasks and boards manually for better organization
- **Column Reordering**: Drag columns to reorder them horizontally
- **Task Creation Restriction**: Tasks can only be created in the "To-Do" column to enforce workflow
- **Responsive Design**: Columns automatically wrap vertically on mobile and when window is resized
- **Optimistic UI**: Instant feedback with no page refreshes during drag-and-drop operations
- **Task Search**: Real-time search and filtering of tasks within boards

### 🏷️ Priority Tagging System

- **Priority Levels**: Mark tasks as "Normal Priority" or "High Priority"
- **Visual Indicators**: High priority tasks display with bold borders and warning icon
- **Theme-Aware Design**: Priority tags follow Kibble's black-white aesthetic
- **Task Creation**: Set priority when creating new tasks (default: Normal)
- **Task Editing**: Update priority for existing tasks via edit dialog
- **Search Integration**: Search by priority keywords ("high priority", "normal priority")
- **Filter Support**: Filter tasks by priority in search interface
- **Archive Integration**: Priority tags visible in archived tasks

### 🔍 Search & Filter System

- **Real-time Search**: Instant search as you type with optimized performance
- **Multi-field Search**: Search across task titles, descriptions, board names, and tag names
- **Fuzzy Matching**: Intelligent search that finds relevant results even with partial matches
- **Context-Aware Filters**: Filter options adapt based on current page (Main, Archive, Sidebar)
- **Priority Filters**: Filter by "High Priority" or "Normal Priority" tasks
- **Archive Search**: Search archived tasks and boards with dedicated filters
- **Seamless UX**: No input interruption, smooth typing experience across all search bars
- **Empty States**: Clear messaging when no results are found

### 📦 Archive System

- **Dedicated Archive Page**: Full-featured archive management with tabbed interface (Tasks/Boards)
- **Real-time Updates**: Archive changes update in real-time across all tabs using localStorage events
- **Restore Functionality**: Restore archived items back to active boards with one click
- **Board Restore**: Restoring a board automatically restores all its tasks
- **Task Restore Protection**: Tasks from archived boards cannot be restored individually (must restore board first)
- **Task Count Display**: Archived boards show accurate count of archived tasks
- **CSV Export**: Export archived tasks and boards to CSV for backup and analysis
- **Auto-Archive**: Automatic archiving of tasks after 24 hours in "Done" column
- **Manual Archive**: Archive boards and tasks manually for organization
- **Event-Driven Architecture**: Uses localStorage events and CustomEvents for cross-tab synchronization
- **Visibility API Integration**: Efficient background updates only when tab is visible
- **Immediate UI Updates**: Restored boards and tasks appear immediately without page refresh

### 🔔 Intelligent Alerts

- **Due Date Alerts**: Real-time notifications for upcoming and overdue tasks
- **Completion Alerts**: Celebrate task completions with visual feedback
- **Smart Notifications**: Contextual alerts based on task status and deadlines
- **Browser Notifications**: Native browser notifications with permission management
- **Alert Persistence**: Alerts persist across page refreshes
- **Visibility API Integration**: Optimizes alert checking when tab is hidden
- **Duplicate Prevention**: Stable alert IDs prevent duplicate notifications
- **Robust Validation**: Comprehensive validation prevents errors from invalid alert data

### 🔒 Security & Privacy

- **User Authentication**: Secure email/password authentication with NextAuth.js v5
- **Multi-Factor Authentication (MFA)**: TOTP-based two-factor authentication with QR code setup
- **MFA Persistence**: MFA settings preserved during password reset (required for reset flow)
- **Password Reset**: Secure MFA-based password reset flow with recovery codes
- **Password Uniqueness**: Enforces unique passwords across all users for enhanced security
- **Data Isolation**: Each user's data is completely isolated and secure
- **Permission System**: Comprehensive permission checks for all operations
- **Secure Sessions**: JWT-based session management
- **Input Validation**: Zod schema validation on all inputs
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
- **Minimal Design**: Clean, minimal interface with high contrast black & white theme
- **PWA Support**: Progressive Web App with service worker and install prompt
- **Icon Generation**: Automated PNG icon generation from SVG source
- **SEO Optimized**: Comprehensive metadata for search engines and social sharing

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router and Turbopack
- **React 19** - UI library with modern hooks
- **TypeScript 5.9** - Full type safety with strict mode
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
- **Sharp** - Image processing for icon generation

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (22+ recommended)
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
   
   # Optional: App URL for metadata (production)
   NEXT_PUBLIC_APP_URL="https://your-domain.com"
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

5. **Generate PWA icons**
   
   Icons are automatically generated during build, but you can generate them manually:
   ```bash
   npm run generate:icons
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
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
│   │   │   ├── check-mfa/       # MFA status check
│   │   │   └── password/         # Password reset flow
│   │   ├── archive/              # Archive operations
│   │   │   ├── boards/           # Archived boards API
│   │   │   ├── tasks/            # Archived tasks API
│   │   │   └── export/           # CSV export functionality
│   │   ├── boards/               # Board CRUD operations
│   │   │   ├── [id]/             # Board-specific operations
│   │   │   │   ├── archive/       # Board archive/unarchive
│   │   │   │   └── route.ts      # Board update/delete
│   │   │   ├── list/             # List user's boards
│   │   │   ├── user/             # Get user's first board
│   │   │   └── route.ts           # Create board
│   │   ├── columns/              # Column management
│   │   ├── tasks/                # Task operations
│   │   │   ├── [id]/             # Task-specific operations
│   │   │   │   ├── archive/       # Task archive/unarchive
│   │   │   │   └── route.ts       # Task update/delete
│   │   │   ├── alerts/           # Tasks with due dates
│   │   │   ├── cleanup/          # Auto-archive cleanup
│   │   │   └── route.ts           # Create task
│   │   └── user/                 # User management
│   │       ├── delete/           # Account deletion
│   │       └── notifications/    # Notification preferences
│   ├── auth/                     # Authentication pages
│   │   ├── signin/               # Sign-in page
│   │   └── password/reset/       # Password reset page
│   ├── archive/                   # Archive page
│   ├── settings/                  # Settings page
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Main dashboard
│   ├── providers.tsx              # Context providers wrapper
│   ├── register-sw.tsx            # Service worker registration
│   └── globals.css                # Global styles
├── components/                     # React components
│   ├── kanban-board.tsx           # Main Kanban board component
│   ├── kanban-column.tsx           # Column component (memoized)
│   ├── kanban-task.tsx            # Task card component (memoized)
│   ├── board-table-view.tsx       # Table view implementation
│   ├── board-grid-view.tsx        # Grid view implementation
│   ├── board-list-view.tsx        # List view implementation
│   ├── layout-selector.tsx        # View mode selector
│   ├── sidebar.tsx                # Navigation sidebar with search
│   ├── search-bar.tsx             # Reusable search component
│   ├── priority-tag.tsx           # Priority tag component
│   ├── notification-system.tsx    # Alert notification panel
│   ├── create-board-dialog.tsx   # Board creation dialog
│   ├── edit-board-dialog.tsx     # Board editing dialog
│   ├── edit-task-dialog.tsx      # Task editing dialog
│   ├── delete-confirmation-dialog.tsx # Delete confirmation
│   ├── pwa-install-prompt.tsx    # PWA install prompt
│   └── orientation-handler.tsx    # Mobile orientation handling
├── contexts/                       # React contexts
│   ├── alert-context.tsx          # Alert management context
│   ├── layout-context.tsx        # Layout preferences context
│   └── theme-context.tsx          # Theme management context
├── lib/                            # Utilities and helpers
│   ├── db.ts                      # Prisma client (singleton pattern)
│   ├── auth.ts                    # NextAuth configuration
│   ├── permissions.ts             # Permission checking utilities
│   ├── alert-utils.ts             # Alert calculation and formatting
│   ├── date-formatters.ts         # Shared date formatting utilities
│   ├── date-utils.ts              # Locale-aware date utilities
│   ├── mfa-utils.ts               # MFA TOTP utilities
│   ├── password-utils.ts         # Password validation and uniqueness
│   ├── archive-events.ts          # Archive event system
│   ├── security-logger.ts         # Security event logging
│   ├── rate-limit.ts              # Rate limiting utilities
│   ├── logger.ts                  # Centralized logging (dev only)
│   ├── request-deduplication.ts   # Request deduplication utility
│   ├── search-utils.ts            # Search and filter utilities
│   └── types.ts                   # TypeScript type definitions
├── prisma/                         # Database schema
│   ├── schema.prisma              # Prisma schema definition
│   └── migrations/                # Database migrations
├── tests/                          # Test files
│   ├── api-boards-archive.test.ts # Board archive tests
│   ├── api-tasks-archive-restore.test.ts # Task restore validation
│   ├── search-utils.test.ts      # Search functionality tests
│   ├── responsive-edge-cases.test.ts # Mobile/desktop edge cases
│   └── [other test files]        # Additional test suites
├── scripts/                        # Utility scripts
│   ├── generate-icons.ts         # PWA icon generation
│   ├── test-db-connection.ts     # Database connection test
│   └── cleanup-database.ts      # Database cleanup script
├── public/                         # Static assets
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service worker
│   ├── icon.svg                   # App icon (source)
│   └── icon-*.png                 # Generated PWA icons
└── [config files]                  # Configuration files
```

## 🏗️ Architecture

### Application Flow

1. **Authentication**: User signs in via NextAuth.js → JWT session created
2. **MFA (Optional)**: User can enable TOTP-based MFA for additional security
3. **Board Selection**: User selects a board → Board data fetched from API
4. **Task Management**: User creates/edits/moves tasks → Optimistic UI updates → Database persistence
5. **Search & Filter**: Real-time search and filtering across tasks and boards
6. **Priority Management**: Set and filter tasks by priority (Normal/High)
7. **Alerts**: System checks due dates → Alerts generated → Browser notifications shown
8. **Auto-Archive**: Background process archives tasks in Done column after 24 hours
9. **Archive Management**: Users can manually archive/restore tasks and boards
10. **Board Archive**: Archiving a board automatically archives all its tasks

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

### Key Design Patterns

- **Singleton Pattern**: Prisma client instance reused across serverless invocations
- **Optimistic UI Updates**: Immediate UI feedback with server synchronization
- **Request Deduplication**: Prevents duplicate concurrent API calls
- **Permission Layering**: Authentication → Ownership → Resource validation
- **Event-Driven Architecture**: Cross-tab synchronization via localStorage events
- **Memoization**: Extensive use of `useMemo`, `useCallback`, and `React.memo` for performance

## 🔌 API Documentation

All API routes are optimized for Vercel serverless with:
- `export const runtime = "nodejs"`
- `export const dynamic = "force-dynamic"`
- `export const maxDuration = 30`

### Authentication Routes

#### `POST /api/auth/register`
Creates a new user account with email/password authentication.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "User Name"
}
```

**Response**: User object or error message

#### `GET/POST /api/auth/[...nextauth]`
NextAuth.js authentication handlers for sign-in, sign-out, and session management.

#### `POST /api/auth/mfa/setup`
Generates TOTP secret and QR code for MFA setup.

**Response**:
```json
{
  "secret": "base32secret",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["code1", "code2", ...]
}
```

#### `POST /api/auth/mfa/verify`
Verifies TOTP token during MFA setup and enables MFA if successful.

#### `POST /api/auth/mfa/login`
Verifies TOTP token or backup code during login (required if MFA enabled).

#### `POST /api/auth/mfa/disable`
Disables MFA for user (requires password confirmation).

#### `GET /api/auth/mfa/status`
Returns MFA status for current user.

#### `POST /api/auth/check-mfa`
Checks if user has MFA enabled after password verification.

#### `POST /api/auth/password/reset/request`
Initiates MFA-based password reset flow.

#### `POST /api/auth/password/reset/confirm`
Confirms password reset with TOTP or recovery code. **Preserves MFA settings** after reset.

### Archive Routes

#### `GET /api/archive/tasks`
Returns all archived tasks for authenticated user, ordered by archive date. Includes board information.

#### `GET /api/archive/boards`
Returns all archived boards for authenticated user with archived tasks count, ordered by archive date.

#### `GET /api/archive/export`
Exports archived tasks and/or boards to CSV format.

**Query Parameters**:
- `type`: `"tasks"` | `"boards"` | `"all"`

### Board Routes

#### `GET /api/boards/list`
Returns all user's active (non-archived) boards, ordered by creation date.

#### `POST /api/boards`
Creates new board with default columns (To-Do, In-Progress, Review, Done).

**Request Body**:
```json
{
  "title": "Board Name"
}
```

#### `GET /api/boards/[id]`
Fetches board with all columns and tasks (excludes archived tasks).

#### `PATCH /api/boards/[id]`
Updates board title (requires ownership).

#### `DELETE /api/boards/[id]`
Deletes board permanently (requires ownership, cascade deletes columns and tasks).

#### `POST /api/boards/[id]/archive`
Archives board and **all its tasks** in a single transaction. Returns count of archived tasks.

**Response**:
```json
{
  "success": true,
  "board": {...},
  "archivedTasksCount": 5,
  "message": "Board and 5 task(s) archived successfully"
}
```

#### `DELETE /api/boards/[id]/archive`
Unarchives (restores) board and **all its tasks** in a single transaction. Returns count of restored tasks.

**Response**:
```json
{
  "success": true,
  "board": {...},
  "restoredTasksCount": 5,
  "message": "Board and 5 task(s) restored successfully"
}
```

#### `GET /api/boards/user`
Returns user's first board (by creation date) for initial selection.

### Task Routes

#### `POST /api/tasks`
Creates new task (only in "To-Do" column).

**Request Body**:
```json
{
  "title": "Task Title",
  "description": "Optional description",
  "dueDate": "2024-12-31T23:59:59",
  "columnId": "column-id",
  "priority": "normal" | "high"
}
```

#### `PATCH /api/tasks/[id]`
Updates task (title, description, dueDate, columnId, order, priority). Handles order recalculation and task locking.

#### `DELETE /api/tasks/[id]`
Deletes task permanently (requires ownership).

#### `POST /api/tasks/[id]/archive`
Archives task manually.

#### `DELETE /api/tasks/[id]/archive`
Unarchives (restores) task. **Prevents restore if task belongs to an archived board**.

**Error Response** (if board is archived):
```json
{
  "error": "Cannot restore task from archived board",
  "message": "This task belongs to an archived board \"[Board Title]\". Please restore the board first before restoring this task.",
  "boardId": "...",
  "boardTitle": "..."
}
```

#### `POST /api/tasks/cleanup`
Archives tasks in Done column older than 24 hours (batch operation).

#### `GET /api/tasks/cleanup`
Returns tasks approaching 24-hour archive mark.

#### `GET /api/tasks/alerts`
Returns tasks with due dates that need alerts (used by notification system).

### Column Routes

#### `POST /api/columns`
Creates new column in a board.

#### `PATCH /api/columns/[id]`
Updates column order (used for drag-and-drop reordering).

### User Routes

#### `DELETE /api/user/delete`
Deletes user account and all associated data (requires password re-authentication).

#### `GET /api/user/notifications`
Returns user's notification preferences.

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
- `archived`: Boolean flag
- `archivedAt`: Timestamp when archived
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
- `archived`: Boolean flag
- `archivedAt`: Timestamp when archived
- `priority`: Priority level ("normal" | "high", default: "normal")
- Relations: `column`
- Indexes: `columnId`, `dueDate`, `movedToDoneAt`, `locked`, `archived`, `archivedAt`, `priority`, `title`

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

## 🔒 Security

### Authentication
- **NextAuth.js v5**: Industry-standard authentication
- **bcryptjs**: Password hashing with appropriate salt rounds
- **JWT Sessions**: Stateless session management
- **MFA (TOTP)**: Time-based One-Time Password for two-factor authentication
- **Backup Codes**: Secure backup codes for MFA recovery
- **MFA Persistence**: MFA settings preserved during password reset

### Authorization
- **Permission System**: All API routes check permissions
- **Resource Ownership**: Users can only access their own data
- **Horizontal Access Control**: Prevents IDOR (Insecure Direct Object Reference)
- **Server-Side Only**: All permission checks happen server-side
- **Input Validation**: Zod schemas validate all inputs

### Password Security
- **Password Uniqueness**: Enforces unique passwords across all users
- **Password Strength**: Minimum 8 characters required
- **Secure Hashing**: bcrypt with appropriate salt rounds
- **Password Reset**: Secure MFA-based reset flow with expiration

### Input Validation
- **Zod Schemas**: Type-safe validation on all API routes
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
- **Event Types**: Login attempts, password resets, MFA setup, permission denials

## 🧪 Testing

### Test Suite

Kibble includes a comprehensive test suite with **462 test cases** (457 passing, 5 skipped):

- **Authentication Tests** (`auth.test.ts`): User registration and authentication
- **Security Tests** (`auth-security.test.ts`): Security edge cases (5 skipped)
- **Task API Tests** (`api-tasks.test.ts`): Task CRUD operations, priority handling
- **Board Archive Tests** (`api-boards-archive.test.ts`): Board archiving with tasks
- **Task Archive Restore Tests** (`api-tasks-archive-restore.test.ts`): Task restore validation
- **Permission Tests** (`permissions.test.ts`): Authorization and access control
- **Task Persistence Tests** (`task-persistence.test.ts`): Data persistence validation
- **Column Behavior Tests** (`column-behavior.test.ts`): Column operations
- **Due Date Alerts Tests** (`due-date-alerts.test.ts`): Alert generation logic
- **Account Deletion Tests** (`account-deletion.test.ts`): Account deletion flow
- **Password Uniqueness Tests** (`password-uniqueness.test.ts`): Password validation
- **Password Reset MFA Tests** (`password-reset-mfa.test.ts`): MFA-based password reset
- **Archive Real-time Tests** (`archive-realtime.test.ts`): Real-time archive updates
- **Board Navigation Tests** (`board-navigation.test.ts`): Board selection and navigation
- **Search Utils Tests** (`search-utils.test.ts`): Search and filter functionality
- **Responsive Edge Cases Tests** (`responsive-edge-cases.test.ts`): Mobile/desktop edge cases
- **Request Deduplication Tests** (`request-deduplication.test.ts`): Request deduplication logic
- **Service Worker Tests**: Registration and logic tests
- **Database Tests**: Connection, cleanup, and RLS compatibility tests

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
  "buildCommand": "npm run generate:icons && prisma generate && next build",
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
- `NEXT_PUBLIC_APP_URL`: Optional app URL for metadata (recommended for SEO)

**Database Setup**:
1. Use Supabase or any PostgreSQL provider
2. Get direct connection string (port 5432, not pooler)
3. Set as `DATABASE_URL` in Vercel
4. Run migrations: `npx prisma migrate deploy`

**Important**: Use direct connection (port 5432) for migrations, not the pooler (port 6543).

### Build Process

1. **Icon Generation**: Generates PWA icons from SVG source
2. **Prisma Generate**: Generates Prisma Client
3. **Next.js Build**: Compiles application with Turbopack
4. **Optimization**: Tree-shaking, code splitting, image optimization

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
npm run db:cleanup   # Cleanup database (dev only)

# Icons
npm run generate:icons # Generate PWA icons from SVG

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
- **Comments**: JSDoc comments for all public functions
- **Logging**: Centralized logger (development only)
- **Nullish Coalescing**: Use `??` instead of `||` for default values
- **Optional Chaining**: Use `?.` for safe property access

### Best Practices

- **Component Memoization**: Use `React.memo` for frequently rendered components
- **Callback Optimization**: Use `useCallback` for event handlers
- **Memoization**: Use `useMemo` for expensive computations
- **Error Handling**: Always use centralized logger, never `console.error` in production
- **Type Safety**: Centralize type definitions to avoid duplication
- **Security First**: All permission checks server-side, input validation on all routes
- **Code Cleanliness**: No redundancies, optimized functions, clean patterns

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

### Build Issues

**Error**: "Prisma Client not generated"
- Run `npm run db:generate` manually
- Check `postinstall` script in package.json
- Verify Prisma schema is valid

**Error**: "Icons not found"
- Run `npm run generate:icons` manually
- Verify `icon.svg` exists in `public/` directory
- Check build process includes icon generation

### Navigation Issues

**Issue**: Boards not loading after navigation
- Ensure `usePathname()` is imported from `next/navigation`
- Check that loading state is properly reset
- Verify API route is responding correctly

### Drag and Drop Issues

**Issue**: Tasks not moving correctly
- Check browser console for errors
- Verify API route is responding
- Check network tab for failed requests
- Ensure touch sensors are configured for mobile

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

**Issue**: Tasks not showing in archived board
- Verify board archive includes tasks (check API response)
- Check that archived tasks are included in archive API query

**Issue**: Cannot restore task
- Verify task's board is not archived (must restore board first)
- Check error message for specific instructions

### Search Issues

**Issue**: Search not working
- Check browser console for errors
- Verify search query is being passed correctly
- Check filter options match current page context

### MFA Issues

**Issue**: MFA setup fails
- Verify QR code is scanned correctly
- Check TOTP code format (6 digits)
- Ensure system clock is synchronized
- Try backup codes if TOTP fails

**Issue**: MFA disabled after password reset
- This should not happen - MFA is preserved during password reset
- Check API route implementation if issue persists

## 📖 Additional Resources

- **[REFERENCES.md](./REFERENCES.md)** - Official documentation links for all technologies

## 📝 License

ISC

---

**Made with ❤️ for students and professionals who want to stay organized**
