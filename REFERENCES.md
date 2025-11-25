# 📚 KIBBLE PROJECT REFERENCES

Official documentation for all technologies in the stack.

---

## 🎯 Core Framework

### Next.js
**Official Documentation:** https://nextjs.org/docs

The React framework for production. Covers:
- App Router (we use this)
- Server Components
- API Routes
- Routing & Navigation
- Data Fetching
- Caching & Revalidation
- Middleware
- Server Actions

**Key Sections to Reference:**
- [App Router](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Metadata & SEO](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

---

## 🎨 Styling & UI

### Tailwind CSS
**Official Documentation:** https://tailwindcss.com/docs

Utility-first CSS framework.

**Key Sections:**
- [Utility Classes](https://tailwindcss.com/docs/styling-with-utility-classes)
- [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Customization](https://tailwindcss.com/docs/configuration)

### shadcn/ui
**Official Documentation:** https://ui.shadcn.com/docs

Re-usable components built with Radix UI and Tailwind CSS.

**Key Sections:**
- [Installation (Next.js)](https://ui.shadcn.com/docs/installation/next)
- [Components](https://ui.shadcn.com/docs/components/accordion)
- [Theming](https://ui.shadcn.com/docs/theming)
- [CLI](https://ui.shadcn.com/docs/cli)

**Common Components We'll Use:**
- Button, Card, Dialog, Input, Select
- Dropdown Menu, Toast, Tooltip
- Form, Label, Textarea

---

## 🗄️ Database & ORM

### Prisma
**Official Documentation:** https://www.prisma.io/docs

Next-generation Node.js and TypeScript ORM.

**Key Sections:**
- [Getting Started](https://www.prisma.io/docs/getting-started)
- [Prisma Schema](https://www.prisma.io/docs/concepts/components/prisma-schema)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
- [Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

**Common Commands:**
```bash
npx prisma generate       # Generate Prisma Client
npx prisma migrate dev    # Create & apply migrations
npx prisma studio         # Open database GUI
npx prisma db push        # Push schema without migration
```

### PostgreSQL
**Official Documentation:** https://www.postgresql.org/docs/current/

Our relational database.

**Key Topics:**
- Data Types
- Indexes
- Constraints
- Transactions
- Performance Tuning

### Supabase (PostgreSQL Hosting)
**Official Documentation:** https://supabase.com/docs

Open source Firebase alternative with PostgreSQL.

**Key Sections:**
- [Database](https://supabase.com/docs/guides/database)
- [Auth](https://supabase.com/docs/guides/auth)
- [Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

## 🔐 Authentication

### NextAuth.js
**Official Documentation:** https://next-auth.js.org/

Authentication for Next.js applications.

**Key Sections:**
- [Getting Started](https://next-auth.js.org/getting-started/introduction)
- [Configuration](https://next-auth.js.org/configuration/options)
- [Providers](https://next-auth.js.org/configuration/providers/oauth)
- [Adapters](https://next-auth.js.org/adapters/overview)
- [Prisma Adapter](https://next-auth.js.org/adapters/prisma)
- [Callbacks](https://next-auth.js.org/configuration/callbacks)
- [Session Strategies](https://next-auth.js.org/configuration/options#session)

**We use:**
- Prisma Adapter (for database sessions)
- Email/Password or OAuth providers
- Server-side session checking with `getServerSession()`

---

## 🎯 Drag & Drop

### dnd kit
**Official Documentation:** https://docs.dndkit.com/

Modern drag and drop toolkit for React.

**Key Sections:**
- [Introduction](https://docs.dndkit.com/introduction/getting-started)
- [Droppable](https://docs.dndkit.com/api-documentation/droppable)
- [Draggable](https://docs.dndkit.com/api-documentation/draggable)
- [Sortable](https://docs.dndkit.com/presets/sortable)
- [Sensors](https://docs.dndkit.com/api-documentation/sensors)
- [Collision Detection](https://docs.dndkit.com/api-documentation/context-provider#collision-detection-algorithms)

**Core Packages We Use:**
- `@dnd-kit/core` - Core dragging functionality
- `@dnd-kit/sortable` - Sortable lists (for kanban columns)

---

## ⚛️ React

### React
**Official Documentation:** https://react.dev/reference/react

The library for web and native user interfaces.

**Key Sections:**
- [Hooks Reference](https://react.dev/reference/react)
- [useState](https://react.dev/reference/react/useState)
- [useEffect](https://react.dev/reference/react/useEffect)
- [useContext](https://react.dev/reference/react/useContext)
- [Server Components](https://react.dev/reference/react/use-server)

**Important Concepts:**
- Client Components (`"use client"`)
- Server Components (default in App Router)
- Hooks
- Event Handling
- Conditional Rendering

---

## 🔤 TypeScript

### TypeScript
**Official Documentation:** https://www.typescriptlang.org/docs/

JavaScript with syntax for types.

**Key Sections:**
- [Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
- [Modules](https://www.typescriptlang.org/docs/handbook/2/modules.html)

**Common Types We Use:**
- Prisma-generated types
- React component prop types
- NextAuth session types
- API response types

---

## 🚀 Deployment

### Vercel
**Official Documentation:** https://vercel.com/docs

Platform for frontend frameworks and static sites.

**Key Sections:**
- [Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Domains](https://vercel.com/docs/concepts/projects/domains)
- [PostgreSQL Integration](https://vercel.com/docs/storage/vercel-postgres)

**Deployment Process:**
1. Connect GitHub repo
2. Configure environment variables
3. Deploy automatically on push

---

## 🛠️ Development Tools

### npm
Node Package Manager - for installing dependencies.

```bash
npm install <package>        # Install a package
npm install -D <package>     # Install as dev dependency
npm run dev                  # Start development server
npm run build                # Build for production
npm run start                # Start production server
```

### Git
Version control system.

```bash
git add .                    # Stage all changes
git commit -m "message"      # Commit changes
git push                     # Push to remote
git pull                     # Pull from remote
```

---

## 📦 Package Versions

Current stack versions (as of initialization):

- **Next.js:** 15.x (latest)
- **React:** 18.x
- **TypeScript:** 5.x
- **Tailwind CSS:** 3.x
- **Prisma:** 5.x
- **NextAuth:** 4.x
- **dnd-kit:** 6.x
- **shadcn/ui:** Latest

---

## 🔗 Quick Links

| Technology | Documentation | GitHub |
|------------|--------------|--------|
| Next.js | [Docs](https://nextjs.org/docs) | [Repo](https://github.com/vercel/next.js) |
| Prisma | [Docs](https://www.prisma.io/docs) | [Repo](https://github.com/prisma/prisma) |
| Tailwind | [Docs](https://tailwindcss.com/docs) | [Repo](https://github.com/tailwindlabs/tailwindcss) |
| shadcn/ui | [Docs](https://ui.shadcn.com/docs) | [Repo](https://github.com/shadcn/ui) |
| NextAuth | [Docs](https://next-auth.js.org) | [Repo](https://github.com/nextauthjs/next-auth) |
| dnd-kit | [Docs](https://docs.dndkit.com) | [Repo](https://github.com/clauderic/dnd-kit) |
| Supabase | [Docs](https://supabase.com/docs) | [Repo](https://github.com/supabase/supabase) |
| Vercel | [Docs](https://vercel.com/docs) | [Platform](https://vercel.com) |

---

## 📝 Notes

- Always reference the **official documentation** first
- Check GitHub issues for common problems
- Use TypeScript for type safety
- Follow Next.js App Router conventions
- Keep Prisma schema as source of truth
- Use shadcn/ui for consistent design system

---

## 🆘 Troubleshooting Resources

- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Prisma Community Discord](https://pris.ly/discord)
- [NextAuth Discussions](https://github.com/nextauthjs/next-auth/discussions)
- [shadcn/ui GitHub Issues](https://github.com/shadcn/ui/issues)
- [Stack Overflow](https://stackoverflow.com/) - Tag with specific tech

---

**Last Updated:** November 2024  
**Stack:** Next.js 15 + Prisma + shadcn/ui + dnd-kit + NextAuth
