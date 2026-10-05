# Refactored Winner

**Build fast. Refactor smart. Scale confidently.**

Refactored Winner is a developer productivity platform for turning technical debt into maintainable, scalable software.

## v0.1.0

The first release establishes the authenticated workspace foundation:

- Credentials-based registration and sign-in with Auth.js
- Protected dashboard, projects, tasks, and settings routes
- PostgreSQL persistence through Prisma
- User-owned projects
- User-owned tasks scoped through their projects
- Task completion/reopening
- Task deletion
- Project deletion with cascading task cleanup
- Dashboard project/task counts
- Server-side authorization checks on mutations

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Auth.js
- Prisma
- PostgreSQL
- Node.js

## Local setup

### Requirements

- Node.js 20+
- PostgreSQL 14+ (or a compatible hosted PostgreSQL database)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Set a real PostgreSQL connection string and a long random Auth.js secret in `.env.local`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/refactored_winner"
AUTH_SECRET="your-long-random-secret"
```

Never commit `.env.local` or production credentials.

### 3. Generate Prisma Client and apply migrations

```bash
npm run db:generate
npm run db:deploy
```

For local schema development, use:

```bash
npm run db:migrate
```

### 4. Start the app

```bash
npm run dev
```

Open http://localhost:3000.

## Core flow

**Register → Sign in → Create Project → Create Task → Complete/Delete Task → Dashboard**

## Quality checks

```bash
npm run lint
npm run build
```

CI also runs these checks against a PostgreSQL service.

## Documentation

- `CONTRIBUTING.md` — local development and contribution workflow
- `docs/architecture.md` — application architecture and authorization model

## Roadmap

- **v0.2** — GitHub integration
- **v0.3** — Team collaboration
- **v0.4** — AI task assistant
- **v0.5** — Code quality scanner
- **v1.0** — Refactored Winner platform

## License

MIT
