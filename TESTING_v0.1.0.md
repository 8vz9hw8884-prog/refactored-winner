# v0.1.0 End-to-End Testing Guide

This document outlines the complete testing flow for v0.1.0 validation. Focus on **functionality**, not UI polish.

## Prerequisites

### 1. PostgreSQL Setup

**Local PostgreSQL:**
```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Then create the database
createdb refactored_winner
```

**Or use a hosted provider:**
- [Neon](https://neon.tech) — free tier available
- [Railway](https://railway.app) — simple deployment
- [AWS RDS](https://aws.amazon.com/rds/postgresql/)

### 2. Clone & Install

```bash
git clone https://github.com/8vz9hw8884-prog/refactored-winner.git
cd refactored-winner
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/refactored_winner"
AUTH_SECRET="$(openssl rand -base64 32)"
```

### 4. Database Initialization

```bash
npm run db:generate
npm run db:deploy
```

## Testing Workflow

### Step 1: Start the Development Server
```bash
npm run dev
```

Navigate to **http://localhost:3000**

### Step 2: Register a New User
- [ ] Click "Register"
- [ ] Enter email and password
- [ ] Submit the form
- [ ] Verify redirect to sign-in page or dashboard

### Step 3: Sign In
- [ ] Use the credentials from registration
- [ ] Verify successful login and redirect to dashboard
- [ ] Verify user context is available (check header/navigation for user info)

### Step 4: Navigate to Projects Page
- [ ] From dashboard, navigate to Projects
- [ ] Verify page loads and displays empty state (no projects yet)
- [ ] Verify "Create Project" button is present

### Step 5: Create a Project
- [ ] Click "Create Project"
- [ ] Enter project name (e.g., "Test Project 1")
- [ ] Submit form
- [ ] Verify redirect to project detail page or projects list
- [ ] Verify new project appears in the list
- [ ] Verify project count increments on dashboard

### Step 6: Create Tasks
- [ ] Enter the created project
- [ ] Click "Create Task"
- [ ] Add task title (e.g., "Refactor API endpoints")
- [ ] Add task description (optional)
- [ ] Submit form
- [ ] Verify task appears in the project's task list
- [ ] Create 2–3 more tasks for testing state changes

### Step 7: Complete a Task
- [ ] Click on a task in the list
- [ ] Click "Mark Complete" or toggle completion status
- [ ] Verify task status changes (visual indicator or state update)
- [ ] Verify task completion persists on page reload

### Step 8: Reopen a Completed Task
- [ ] Click on the completed task
- [ ] Click "Reopen" or toggle status back
- [ ] Verify task returns to "Open" state
- [ ] Verify state persists on page reload

### Step 9: Delete a Task
- [ ] From a project, click "Delete" on a task
- [ ] Confirm deletion (if a modal/confirmation is shown)
- [ ] Verify task is removed from the list
- [ ] Verify task count on dashboard updates

### Step 10: Delete a Project
- [ ] From the projects list, click "Delete" on a project
- [ ] Confirm deletion
- [ ] Verify project is removed from the list
- [ ] Verify all associated tasks are deleted (check database or UI)
- [ ] Verify project count on dashboard updates

### Step 11: Dashboard Verification
- [ ] Return to dashboard
- [ ] Verify project count reflects deletions
- [ ] Verify task count reflects deletions
- [ ] Verify no stale data is displayed

### Step 12: Sign Out
- [ ] Click sign-out button
- [ ] Verify redirect to sign-in page or home
- [ ] Verify session is cleared

### Step 13: Protected Route Access (Authorization)
- [ ] While signed out, try to access `/dashboard` directly
- [ ] Verify redirect to sign-in page
- [ ] Try to access `/projects` directly
- [ ] Verify redirect to sign-in page

### Step 14: Multiple User Isolation
- [ ] Register a second user with a different email
- [ ] Sign in as the second user
- [ ] Verify projects and tasks from the first user are NOT visible
- [ ] Create a project and task as the second user
- [ ] Verify separation between user data

## Quality Checks

After all functional tests pass, run:

```bash
npm run lint
```

Fix any linting errors. Then:

```bash
npm run build
```

Verify the build completes without errors.

## Test Results Template

```
Date: ____________________
Tester: ____________________

PostgreSQL Setup:      ☐ Pass ☐ Fail
Dependencies Install:  ☐ Pass ☐ Fail
Database Migration:    ☐ Pass ☐ Fail
Dev Server Start:      ☐ Pass ☐ Fail

FUNCTIONAL TESTS:
- Registration:        ☐ Pass ☐ Fail
- Sign In:             ☐ Pass ☐ Fail
- Create Project:      ☐ Pass ☐ Fail
- Create Task:         ☐ Pass ☐ Fail
- Complete Task:       ☐ Pass ☐ Fail
- Reopen Task:         ☐ Pass ☐ Fail
- Delete Task:         ☐ Pass ☐ Fail
- Delete Project:      ☐ Pass ☐ Fail
- Dashboard Update:    ☐ Pass ☐ Fail
- Sign Out:            ☐ Pass ☐ Fail
- Protected Routes:    ☐ Pass ☐ Fail
- User Isolation:      ☐ Pass ☐ Fail

QUALITY CHECKS:
- Lint:                ☐ Pass ☐ Fail
- Build:               ☐ Pass ☐ Fail

ISSUES FOUND:
(List any bugs, missing features, or unexpected behavior)

NOTES:
```

## Common Issues & Troubleshooting

| Issue | Solution |
|-------|----------|
| `error: connect ECONNREFUSED` | PostgreSQL not running. Start it with `brew services start postgresql@15` or verify your hosted connection string. |
| `Prisma migration error` | Clear `.prisma` folder and re-run `npm run db:generate && npm run db:deploy`. |
| `AUTH_SECRET not set` | Ensure `.env.local` has a valid `AUTH_SECRET` environment variable. |
| `Port 3000 already in use` | Run `npm run dev -- -p 3001` to use a different port. |
| `Module not found` | Run `npm install` again and clear `.next` folder. |

## Next Steps After v0.1.0

Once all tests pass:
1. Commit test results
2. Tag the release: `git tag v0.1.0`
3. Plan v0.2 (GitHub integration)
4. Do **not** spend time on UI polish yet — focus on features

---

**Status:** v0.1.0 ready for testing
