# Architecture

Refactored Winner is a Next.js App Router application with PostgreSQL persistence through Prisma.

## Request flow

- Browser requests enter the Next.js App Router.
- Auth.js manages sessions and protects workspace routes.
- Server actions perform authenticated project/task mutations.
- Prisma provides typed database access.
- PostgreSQL stores users, projects, and tasks.

## Security boundary

Project and task queries are scoped to the authenticated user's email-derived account. Task creation additionally verifies that the selected project belongs to the current user.

## Near-term evolution

Authentication can later add OAuth providers without changing the project/task domain model.