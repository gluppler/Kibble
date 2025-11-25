# Kibble - Kanban Board

A drag-and-drop kanban board built with Next.js 15, Prisma, and dnd-kit.

## Features

- ✅ Full drag-and-drop functionality
- ✅ Create tasks in any column
- ✅ Move tasks between columns
- ✅ Persistent storage with PostgreSQL
- ✅ Modern UI with Tailwind CSS
- ✅ Dark mode support

## Getting Started

### Prerequisites

- Node.js 20+ (or 22+)
- PostgreSQL database (local or hosted on Supabase)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your database connection in `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kibble?schema=public"
```

3. Generate Prisma Client:
```bash
npm run db:generate
```

4. Run database migrations:
```bash
npm run db:migrate
```

Or if you prefer to push the schema directly:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
kibble/
├── app/              # Next.js App Router
│   ├── api/          # API routes
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
│   ├── kanban-board.tsx
│   ├── kanban-column.tsx
│   └── kanban-task.tsx
├── lib/              # Utilities
│   ├── db.ts         # Prisma client
│   └── auth.ts       # NextAuth config
├── server/           # Server helpers
│   └── auth.ts       # Auth session helper
└── prisma/           # Database schema
    └── schema.prisma
```

## Usage

1. The app automatically creates a board on first load
2. Click "+ Add task" in any column to create a new task
3. Drag tasks between columns to move them
4. Tasks are automatically saved to the database

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **dnd-kit** - Drag and drop
- **Tailwind CSS** - Styling

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## License

ISC
