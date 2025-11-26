# 🎓 Kibble

A lightweight, full-stack web application designed to help students organize coursework and manage academic deadlines. Kibble features secure data isolation for each user, class-based task categories, and a visual Kanban board for tracking progress with intelligent alerts.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=flat-square&logo=postgresql)

## ✨ Features

### 📚 Class-Based Task Management
- **Multiple Boards**: Create separate boards for different classes or subjects
- **Organized Structure**: Each board contains its own columns and tasks
- **Easy Navigation**: Quick access to all your classes via sidebar

### 📋 Kanban Board
- **Drag & Drop**: Intuitive drag-and-drop interface for task management
- **Multiple Views**: Switch between Kanban, Table, Grid, and List views
- **Task Organization**: Organize tasks across columns (To-Do, In-Progress, Review, Done)
- **Task Locking**: Tasks automatically lock when moved to "Done" column
- **Auto-Cleanup**: Tasks in "Done" column are automatically deleted after 24 hours

### 🔔 Intelligent Alerts
- **Due Date Alerts**: Real-time notifications for upcoming and overdue tasks
- **Completion Alerts**: Celebrate task completions with visual feedback
- **Smart Notifications**: Contextual alerts based on task status and deadlines

### 🔒 Security & Privacy
- **User Authentication**: Secure email/password authentication with NextAuth.js
- **Data Isolation**: Each user's data is completely isolated and secure
- **Permission System**: Comprehensive permission checks for all operations
- **Secure Sessions**: JWT-based session management

### 🎨 User Experience
- **Dark Mode**: Beautiful dark and light themes
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations**: Polished UI with Framer Motion animations
- **Real-time Updates**: Optimistic UI updates for instant feedback

### 📊 Task Features
- **Task Details**: Title, description, and due date for each task
- **Task Creation**: Create tasks directly in the "To-Do" column
- **Task Editing**: Edit task details inline
- **Task Deletion**: Remove tasks with confirmation dialogs
- **Due Date Tracking**: Visual indicators for overdue and upcoming tasks

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
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
- **PostgreSQL** database (local or hosted on [Supabase](https://supabase.com))
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
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── boards/          # Board CRUD operations
│   │   ├── columns/         # Column management
│   │   ├── tasks/           # Task operations
│   │   └── user/            # User management
│   ├── auth/                # Authentication pages
│   ├── settings/            # Settings page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main dashboard
│   └── providers.tsx        # Context providers
├── components/              # React components
│   ├── kanban-board.tsx     # Main Kanban board
│   ├── kanban-column.tsx    # Column component
│   ├── kanban-task.tsx      # Task card component
│   ├── board-table-view.tsx # Table view
│   ├── board-grid-view.tsx  # Grid view
│   ├── board-list-view.tsx  # List view
│   ├── sidebar.tsx          # Navigation sidebar
│   ├── notification-system.tsx # Alert system
│   └── ...                  # Other UI components
├── contexts/                # React contexts
│   ├── alert-context.tsx    # Alert management
│   ├── layout-context.tsx   # Layout preferences
│   └── theme-context.tsx    # Theme management
├── lib/                     # Utilities and helpers
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # NextAuth configuration
│   ├── permissions.ts      # Permission utilities
│   ├── alert-utils.ts      # Alert utilities
│   └── types.ts            # TypeScript types
├── server/                  # Server-side utilities
│   └── auth.ts             # Auth session helper
├── prisma/                  # Database schema
│   ├── schema.prisma       # Prisma schema
│   └── migrations/         # Database migrations
├── tests/                   # Test files
├── public/                  # Static assets
└── types/                   # Type definitions
```

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema to database (dev only)
- `npm run db:studio` - Open Prisma Studio
- `npm run db:test` - Test database connection

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage

## 🌐 Deployment

### Vercel (Recommended)

Kibble is optimized for Vercel deployment. See detailed guides:

- **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Complete deployment guide
- **[VERCEL_ENV_VARIABLES.md](./VERCEL_ENV_VARIABLES.md)** - Environment variables setup
- **[VERCEL_OPTIMIZATIONS.md](./VERCEL_OPTIMIZATIONS.md)** - Performance optimizations

**Quick Deploy:**
1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com)
3. Add environment variables (see `VERCEL_ENV_VARIABLES.md`)
4. Deploy!

### Database Setup (Supabase)

For Supabase database setup, see:
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Detailed Supabase guide
- **[QUICK_SUPABASE_SETUP.md](./QUICK_SUPABASE_SETUP.md)** - Quick reference

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | `http://localhost:3000` (dev) or `https://your-domain.vercel.app` (prod) |

### Optional Variables

- `NEXT_PUBLIC_SUPABASE_URL` - If using Supabase features
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - If using Supabase features

See [`.env.example`](./.env.example) for a complete template.

## 📖 Usage Guide

### Creating Your First Board

1. **Sign Up**: Create an account with your email and password
2. **Auto-Creation**: A default board is automatically created on first login
3. **Create More**: Click the "+" button next to "Classes" in the sidebar to create additional boards

### Managing Tasks

1. **Create Task**: Click "+ Add task" in the "To-Do" column
2. **Add Details**: Enter title, description (optional), and due date (optional)
3. **Move Tasks**: Drag tasks between columns to update their status
4. **Edit Task**: Click the menu (⋮) on a task card and select "Edit"
5. **Delete Task**: Click the menu (⋮) on a task card and select "Delete"

### View Modes

Switch between different view modes using the layout selector:
- **Kanban View**: Traditional column-based board
- **Table View**: Spreadsheet-like view with checkmarks
- **Grid View**: Card-based grid layout
- **List View**: Compact list format

### Task Locking

- Tasks automatically lock when moved to the "Done" column
- Locked tasks cannot be edited
- Locked tasks are automatically deleted after 24 hours

### Alerts & Notifications

- **Due Date Alerts**: Get notified about upcoming and overdue tasks
- **Completion Alerts**: Celebrate when tasks are completed
- **Notification Panel**: Click the bell icon to view all alerts

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui
```

Test files are located in the `tests/` directory and cover:
- Authentication and security
- API endpoints
- Task persistence
- Column behavior
- Due date alerts
- Permissions

## 🔒 Security Features

- ✅ **Secure Authentication**: Email/password with bcrypt hashing
- ✅ **Session Management**: JWT-based secure sessions
- ✅ **Data Isolation**: Users can only access their own data
- ✅ **Permission Checks**: Comprehensive permission system
- ✅ **Input Validation**: Zod schema validation
- ✅ **SQL Injection Protection**: Prisma ORM prevents SQL injection
- ✅ **XSS Protection**: React's built-in XSS protection
- ✅ **CSRF Protection**: NextAuth.js CSRF tokens

## 🎨 Design Principles

Kibble follows established UX principles:
- **Jakob's Law**: Familiar kanban patterns
- **Fitts's Law**: Large, accessible touch targets
- **Hick's Law**: Limited choices for better decisions
- **Miller's Law**: Chunked information display
- **Aesthetic-Usability Effect**: Beautiful, functional design

See [UX-LAWS.md](./UX-LAWS.md) for detailed design guidelines.

## 📚 Documentation

- **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** - Development instructions
- **[REFERENCES.md](./REFERENCES.md)** - Technical references
- **[SECURITY-LAWS.md](./SECURITY-LAWS.md)** - Security guidelines
- **[UX-LAWS.md](./UX-LAWS.md)** - UX design principles
- **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Vercel deployment guide
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Supabase setup guide

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass

## 📝 License

ISC

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)
- Drag and drop powered by [dnd-kit](https://dndkit.com/)
- Icons from [Lucide](https://lucide.dev/)
- Animations by [Framer Motion](https://www.framer.com/motion/)

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Made with ❤️ for students who want to stay organized**
